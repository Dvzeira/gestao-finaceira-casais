import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type {
  ExpenseCategoryEntity,
  IExpenseCategoryRepository,
} from './interfaces/expense-category-repository.interface';
import { ExpenseCategoriesService } from './expense-categories.service';

function buildCategory(
  overrides: Partial<ExpenseCategoryEntity> = {},
): ExpenseCategoryEntity {
  return {
    id: 'category-1',
    coupleId: 'couple-1',
    name: 'Lazer',
    icon: 'party-popper',
    color: '#db2777',
    ...overrides,
  };
}

describe('ExpenseCategoriesService', () => {
  let service: ExpenseCategoriesService;
  let repository: jest.Mocked<IExpenseCategoryRepository>;

  beforeEach(() => {
    repository = {
      findAllForCouple: jest.fn(),
      findById: jest.fn(),
      findByCoupleIdAndName: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    };

    service = new ExpenseCategoriesService(repository);
  });

  describe('findAll', () => {
    it('retorna as categorias globais e do casal', async () => {
      repository.findAllForCouple.mockResolvedValue([
        buildCategory({ id: 'global-1', coupleId: null, name: 'Moradia' }),
        buildCategory(),
      ]);

      const result = await service.findAll('couple-1');

      expect(result).toHaveLength(2);
      expect(repository.findAllForCouple).toHaveBeenCalledWith('couple-1');
    });
  });

  describe('create', () => {
    it('cria uma categoria personalizada para o casal', async () => {
      repository.findByCoupleIdAndName.mockResolvedValue(null);
      repository.create.mockResolvedValue(buildCategory({ name: 'Pets' }));

      const result = await service.create('couple-1', { name: 'Pets' });

      expect(repository.create).toHaveBeenCalledWith({
        coupleId: 'couple-1',
        name: 'Pets',
        icon: undefined,
        color: undefined,
      });
      expect(result.name).toBe('Pets');
    });

    it('lança ConflictException quando já existe categoria global com o mesmo nome', async () => {
      repository.findByCoupleIdAndName.mockImplementation((coupleId) =>
        Promise.resolve(
          coupleId === null
            ? buildCategory({ coupleId: null, name: 'Moradia' })
            : null,
        ),
      );

      await expect(
        service.create('couple-1', { name: 'Moradia' }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(repository.create).not.toHaveBeenCalled();
    });

    it('lança ConflictException quando já existe categoria do casal com o mesmo nome', async () => {
      repository.findByCoupleIdAndName.mockImplementation((coupleId) =>
        Promise.resolve(coupleId === 'couple-1' ? buildCategory() : null),
      );

      await expect(
        service.create('couple-1', { name: 'Lazer' }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('remove uma categoria personalizada do casal', async () => {
      repository.findById.mockResolvedValue(buildCategory());

      await service.remove('couple-1', 'category-1');

      expect(repository.delete).toHaveBeenCalledWith('category-1');
    });

    it('lança NotFoundException quando a categoria não existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.remove('couple-1', 'category-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lança ForbiddenException ao tentar remover categoria global', async () => {
      repository.findById.mockResolvedValue(buildCategory({ coupleId: null }));

      await expect(
        service.remove('couple-1', 'category-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('lança NotFoundException quando a categoria pertence a outro casal', async () => {
      repository.findById.mockResolvedValue(
        buildCategory({ coupleId: 'couple-2' }),
      );

      await expect(
        service.remove('couple-1', 'category-1'),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});
