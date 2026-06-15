import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EXPENSE_CATEGORY_REPOSITORY,
  ExpenseCategoryEntity,
} from './interfaces/expense-category-repository.interface';
import type { IExpenseCategoryRepository } from './interfaces/expense-category-repository.interface';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { ExpenseCategoryResponseDto } from './dto/expense-category-response.dto';

@Injectable()
export class ExpenseCategoriesService {
  constructor(
    @Inject(EXPENSE_CATEGORY_REPOSITORY)
    private readonly expenseCategoryRepository: IExpenseCategoryRepository,
  ) {}

  async findAll(coupleId: string): Promise<ExpenseCategoryResponseDto[]> {
    const categories =
      await this.expenseCategoryRepository.findAllForCouple(coupleId);
    return categories.map((category) => this.toResponseDto(category));
  }

  // Cria uma categoria personalizada para o casal. Categorias globais
  // (coupleId nulo) são fornecidas via seed e não podem ser criadas por aqui.
  async create(
    coupleId: string,
    dto: CreateExpenseCategoryDto,
  ): Promise<ExpenseCategoryResponseDto> {
    const existingGlobal =
      await this.expenseCategoryRepository.findByCoupleIdAndName(
        null,
        dto.name,
      );
    const existingForCouple =
      await this.expenseCategoryRepository.findByCoupleIdAndName(
        coupleId,
        dto.name,
      );
    if (existingGlobal || existingForCouple) {
      throw new ConflictException('Já existe uma categoria com este nome.');
    }

    const category = await this.expenseCategoryRepository.create({
      coupleId,
      name: dto.name,
      icon: dto.icon,
      color: dto.color,
    });

    return this.toResponseDto(category);
  }

  // Remove uma categoria personalizada do casal. Categorias globais (seed)
  // não podem ser removidas.
  async remove(coupleId: string, id: string): Promise<void> {
    const category = await this.expenseCategoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    if (category.coupleId === null) {
      throw new ForbiddenException(
        'Não é possível remover uma categoria padrão do sistema.',
      );
    }

    if (category.coupleId !== coupleId) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    await this.expenseCategoryRepository.delete(id);
  }

  private toResponseDto(
    category: ExpenseCategoryEntity,
  ): ExpenseCategoryResponseDto {
    return {
      id: category.id,
      coupleId: category.coupleId,
      name: category.name,
      icon: category.icon,
      color: category.color,
    };
  }
}
