import { subcategoryRepository } from '@/src/server/repositories/subcategory-repository'
export const getSubcategories = subcategoryRepository.list
export const createSubcategory = subcategoryRepository.create
