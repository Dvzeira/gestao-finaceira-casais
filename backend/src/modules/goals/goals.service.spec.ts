import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CoupleMemberRole, GoalStatus } from '@prisma/client';
import type {
  IGoalRepository,
  GoalEntity,
} from './interfaces/goal-repository.interface';
import type {
  IGoalContributionRepository,
  GoalContributionEntity,
} from './interfaces/goal-contribution-repository.interface';
import type {
  ICoupleMemberRepository,
  CoupleMemberEntity,
} from '../couples/interfaces/couple-member-repository.interface';
import type { INotificationRepository } from '../notifications/interfaces/notification-repository.interface';
import { GoalsService } from './goals.service';

function buildGoal(overrides: Partial<GoalEntity> = {}): GoalEntity {
  return {
    id: 'goal-1',
    coupleId: 'couple-1',
    title: 'Viagem',
    targetAmount: 10000,
    targetDate: new Date(
      Date.UTC(new Date().getUTCFullYear() + 1, new Date().getUTCMonth(), 1),
    ),
    status: GoalStatus.IN_PROGRESS,
    splits: [
      { userId: 'user-1', percentage: 50 },
      { userId: 'user-2', percentage: 50 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildMember(
  overrides: Partial<CoupleMemberEntity> = {},
): CoupleMemberEntity {
  return {
    id: 'member-1',
    coupleId: 'couple-1',
    userId: 'user-1',
    role: CoupleMemberRole.OWNER,
    joinedAt: new Date(),
    ...overrides,
  };
}

function buildContribution(
  overrides: Partial<GoalContributionEntity> = {},
): GoalContributionEntity {
  return {
    id: 'contribution-1',
    goalId: 'goal-1',
    userId: 'user-1',
    amount: 1000,
    contributedAt: new Date('2026-06-01'),
    createdAt: new Date(),
    ...overrides,
  };
}

describe('GoalsService', () => {
  let goalsService: GoalsService;
  let goalRepository: jest.Mocked<IGoalRepository>;
  let goalContributionRepository: jest.Mocked<IGoalContributionRepository>;
  let coupleMemberRepository: jest.Mocked<ICoupleMemberRepository>;
  let notificationRepository: jest.Mocked<INotificationRepository>;

  beforeEach(() => {
    goalRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByCoupleId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    goalContributionRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByGoalId: jest.fn(),
      sumByGoalId: jest.fn(),
      delete: jest.fn(),
    };

    coupleMemberRepository = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      findByCoupleId: jest.fn(),
      countByCoupleId: jest.fn(),
    };

    notificationRepository = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      countUnread: jest.fn(),
      findById: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    };

    goalsService = new GoalsService(
      goalRepository,
      goalContributionRepository,
      coupleMemberRepository,
      notificationRepository,
    );

    coupleMemberRepository.findByCoupleId.mockResolvedValue([
      buildMember({ userId: 'user-1' }),
      buildMember({
        id: 'member-2',
        userId: 'user-2',
        role: CoupleMemberRole.MEMBER,
      }),
    ]);
  });

  describe('create', () => {
    it('cria uma meta com splits válidos', async () => {
      goalRepository.create.mockResolvedValue(buildGoal());

      const result = await goalsService.create('couple-1', {
        title: 'Viagem',
        targetAmount: 10000,
        targetDate: '2027-06-01',
        splits: [
          { userId: 'user-1', percentage: 50 },
          { userId: 'user-2', percentage: 50 },
        ],
      });

      expect(goalRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ coupleId: 'couple-1', title: 'Viagem' }),
      );
      expect(result.totalContributed).toBe(0);
      expect(result.remainingAmount).toBe(10000);
    });

    it('lança BadRequestException quando a soma dos percentuais não é 100', async () => {
      await expect(
        goalsService.create('couple-1', {
          title: 'Viagem',
          targetAmount: 10000,
          targetDate: '2027-06-01',
          splits: [
            { userId: 'user-1', percentage: 40 },
            { userId: 'user-2', percentage: 50 },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(goalRepository.create).not.toHaveBeenCalled();
    });

    it('lança BadRequestException quando há userId duplicado nos splits', async () => {
      await expect(
        goalsService.create('couple-1', {
          title: 'Viagem',
          targetAmount: 10000,
          targetDate: '2027-06-01',
          splits: [
            { userId: 'user-1', percentage: 50 },
            { userId: 'user-1', percentage: 50 },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(goalRepository.create).not.toHaveBeenCalled();
    });

    it('lança BadRequestException quando um userId não pertence ao casal', async () => {
      await expect(
        goalsService.create('couple-1', {
          title: 'Viagem',
          targetAmount: 10000,
          targetDate: '2027-06-01',
          splits: [
            { userId: 'user-1', percentage: 50 },
            { userId: 'user-3', percentage: 50 },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(goalRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('retorna as metas com o progresso calculado', async () => {
      goalRepository.findByCoupleId.mockResolvedValue([buildGoal()]);
      goalContributionRepository.sumByGoalId.mockResolvedValue(2500);

      const result = await goalsService.findAll('couple-1');

      expect(result).toHaveLength(1);
      expect(result[0]?.totalContributed).toBe(2500);
      expect(result[0]?.remainingAmount).toBe(7500);
      expect(result[0]?.progressPercentage).toBe(25);
    });
  });

  describe('findOne', () => {
    it('lança NotFoundException quando a meta pertence a outro casal', async () => {
      goalRepository.findById.mockResolvedValue(
        buildGoal({ coupleId: 'couple-2' }),
      );

      await expect(
        goalsService.findOne('couple-1', 'goal-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('calcula monthlyContributionTargets proporcionalmente aos splits', async () => {
      goalRepository.findById.mockResolvedValue(buildGoal());
      goalContributionRepository.sumByGoalId.mockResolvedValue(0);

      const result = await goalsService.findOne('couple-1', 'goal-1');

      const totalTargets = result.monthlyContributionTargets.reduce(
        (sum, target) => sum + target.amount,
        0,
      );
      expect(result.monthlyContributionTargets).toHaveLength(2);
      expect(totalTargets).toBeCloseTo(10000 / result.monthsRemaining, 1);
    });
  });

  describe('update', () => {
    it('lança NotFoundException quando a meta não pertence ao casal', async () => {
      goalRepository.findById.mockResolvedValue(
        buildGoal({ coupleId: 'couple-2' }),
      );

      await expect(
        goalsService.update('couple-1', 'goal-1', { title: 'Nova viagem' }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(goalRepository.update).not.toHaveBeenCalled();
    });

    it('revalida os splits quando informados na atualização', async () => {
      goalRepository.findById.mockResolvedValue(buildGoal());

      await expect(
        goalsService.update('couple-1', 'goal-1', {
          splits: [
            { userId: 'user-1', percentage: 30 },
            { userId: 'user-2', percentage: 50 },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(goalRepository.update).not.toHaveBeenCalled();
    });

    it('atualiza a meta quando os dados são válidos', async () => {
      goalRepository.findById.mockResolvedValue(buildGoal());
      goalRepository.update.mockResolvedValue(
        buildGoal({ title: 'Nova viagem' }),
      );
      goalContributionRepository.sumByGoalId.mockResolvedValue(0);

      const result = await goalsService.update('couple-1', 'goal-1', {
        title: 'Nova viagem',
      });

      expect(goalRepository.update).toHaveBeenCalledWith('goal-1', {
        title: 'Nova viagem',
      });
      expect(result.title).toBe('Nova viagem');
    });
  });

  describe('remove', () => {
    it('lança NotFoundException quando a meta não pertence ao casal', async () => {
      goalRepository.findById.mockResolvedValue(
        buildGoal({ coupleId: 'couple-2' }),
      );

      await expect(
        goalsService.remove('couple-1', 'goal-1'),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(goalRepository.delete).not.toHaveBeenCalled();
    });

    it('remove a meta quando pertence ao casal', async () => {
      goalRepository.findById.mockResolvedValue(buildGoal());

      await goalsService.remove('couple-1', 'goal-1');

      expect(goalRepository.delete).toHaveBeenCalledWith('goal-1');
    });
  });

  describe('addContribution', () => {
    it('registra a contribuição sem alterar o status quando o total não alcança a meta', async () => {
      goalRepository.findById.mockResolvedValue(buildGoal());
      goalContributionRepository.create.mockResolvedValue(buildContribution());
      goalContributionRepository.sumByGoalId.mockResolvedValue(1000);

      const result = await goalsService.addContribution(
        'couple-1',
        'goal-1',
        'user-1',
        { amount: 1000, contributedAt: '2026-06-01' },
      );

      expect(result.amount).toBe(1000);
      expect(goalRepository.update).not.toHaveBeenCalled();
    });

    it('marca a meta como ACHIEVED quando o total contribuído alcança o valor alvo', async () => {
      goalRepository.findById.mockResolvedValue(buildGoal());
      goalContributionRepository.create.mockResolvedValue(
        buildContribution({ amount: 10000 }),
      );
      goalContributionRepository.sumByGoalId.mockResolvedValue(10000);

      await goalsService.addContribution('couple-1', 'goal-1', 'user-1', {
        amount: 10000,
        contributedAt: '2026-06-01',
      });

      expect(goalRepository.update).toHaveBeenCalledWith('goal-1', {
        status: GoalStatus.ACHIEVED,
      });
      expect(notificationRepository.create).toHaveBeenCalledTimes(2);
      expect(notificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          type: 'GOAL_ACHIEVED',
          relatedEntityId: 'goal-1',
        }),
      );
      expect(notificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-2',
          type: 'GOAL_ACHIEVED',
          relatedEntityId: 'goal-1',
        }),
      );
    });
  });

  describe('findContributions', () => {
    it('lança NotFoundException quando a meta não pertence ao casal', async () => {
      goalRepository.findById.mockResolvedValue(
        buildGoal({ coupleId: 'couple-2' }),
      );

      await expect(
        goalsService.findContributions('couple-1', 'goal-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('removeContribution', () => {
    it('lança NotFoundException quando a contribuição não pertence à meta', async () => {
      goalRepository.findById.mockResolvedValue(buildGoal());
      goalContributionRepository.findById.mockResolvedValue(
        buildContribution({ goalId: 'goal-2' }),
      );

      await expect(
        goalsService.removeContribution('couple-1', 'goal-1', 'contribution-1'),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(goalContributionRepository.delete).not.toHaveBeenCalled();
    });

    it('volta o status para IN_PROGRESS quando o total cai abaixo do valor alvo', async () => {
      goalRepository.findById.mockResolvedValue(
        buildGoal({ status: GoalStatus.ACHIEVED }),
      );
      goalContributionRepository.findById.mockResolvedValue(
        buildContribution(),
      );
      goalContributionRepository.sumByGoalId.mockResolvedValue(5000);

      await goalsService.removeContribution(
        'couple-1',
        'goal-1',
        'contribution-1',
      );

      expect(goalContributionRepository.delete).toHaveBeenCalledWith(
        'contribution-1',
      );
      expect(goalRepository.update).toHaveBeenCalledWith('goal-1', {
        status: GoalStatus.IN_PROGRESS,
      });
    });
  });
});
