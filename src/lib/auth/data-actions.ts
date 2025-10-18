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
    const res = await rolesService.getRoles()
    return res.data
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
    const res = await departmentsService.getDepartments()
    return res.data
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
    return await usersService.updateUser(id, userData)
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
