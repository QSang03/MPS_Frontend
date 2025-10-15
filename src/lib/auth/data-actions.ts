'use server'

import { rolesService } from '@/lib/api/services/roles.service'
import { departmentsService } from '@/lib/api/services/departments.service'
import { usersService } from '@/lib/api/services/users.service'
import type { UserRole, Department, User } from '@/types/users'

/**
 * Server action to get roles for client-side use
 */
export async function getRolesForClient(): Promise<UserRole[]> {
  try {
    return await rolesService.getRoles()
  } catch (error) {
    console.error('Failed to get roles:', error)
    return []
  }
}

/**
 * Server action to get departments for client-side use
 */
export async function getDepartmentsForClient(): Promise<Department[]> {
  try {
    return await departmentsService.getDepartments()
  } catch (error) {
    console.error('Failed to get departments:', error)
    return []
  }
}

/**
 * Server action to update user for client-side use
 */
export async function updateUserForClient(id: string, userData: Partial<User>): Promise<User> {
  try {
    // Perform the update, then refetch the full user to ensure nested relations (role, department, customer)
    await usersService.updateUser(id, userData)
    const fullUser = await usersService.getUserById(id)
    return fullUser
  } catch (error) {
    console.error('Failed to update user:', error)
    throw error
  }
}

/**
 * Server action to create user for client-side use
 */
export async function createUserForClient(userData: Partial<User>): Promise<User> {
  try {
    return await usersService.createUser(userData)
  } catch (error) {
    console.error('Failed to create user:', error)
    throw error
  }
}
