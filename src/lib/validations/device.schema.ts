import { z } from 'zod'
import { DeviceStatus } from '@/constants/status'

/**
 * Device form validation schema factory
 * @param t optional translation function (t(key) -> string)
 */
export const createDeviceSchema = (t?: (key: string) => string) => {
  const loc =
    t ??
    ((k: string) => {
      // English defaults when t is not provided
      const _en: Record<string, string> = {
        'device.serial.required': 'Serial is required',
        'device.serial.min': 'Serial must be at least 5 characters',
        'device.serial.max': 'Serial must not exceed 50 characters',
        'device.serial.regex': 'Serial can only contain uppercase letters, numbers and hyphens',
        'device.model.required': 'Model is required',
        'device.model.min': 'Model must be at least 3 characters',
        'device.model.max': 'Model must not exceed 100 characters',
        'device.location.required': 'Location is required',
        'device.location.max': 'Location must not exceed 200 characters',
        'device.customer.required': 'Customer is required',
        'device.ip.invalid': 'Invalid IP address',
        'device.mac.invalid': 'Invalid MAC address',
        'device.firmware.max': 'Firmware version must not exceed 50 characters',
      }
      return _en[k] ?? k
    })

  return z.object({
    serialNumber: z
      .string()
      .trim()
      .min(1, loc('device.serial.required'))
      .min(5, loc('device.serial.min'))
      .max(50, loc('device.serial.max'))
      .regex(/^[A-Z0-9-]+$/, loc('device.serial.regex')),
    model: z
      .string()
      .min(1, loc('device.model.required'))
      .min(3, loc('device.model.min'))
      .max(100, loc('device.model.max')),
    location: z
      .string()
      .min(1, loc('device.location.required'))
      .max(200, loc('device.location.max')),
    customerId: z.string().min(1, loc('device.customer.required')),
    status: z.nativeEnum(DeviceStatus).optional(),
    // Optional network / firmware fields
    ipAddress: z
      .string()
      .optional()
      .refine(
        (v) => !v || /^(25[0-5]|2[0-4]\d|[01]?\d?\d)(\.(25[0-5]|2[0-4]\d|[01]?\d?\d)){3}$/.test(v),
        {
          message: loc('device.ip.invalid'),
        }
      ),
    macAddress: z
      .string()
      .optional()
      .refine((v) => !v || /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(v), {
        message: loc('device.mac.invalid'),
      }),
    firmware: z.string().max(50, loc('device.firmware.max')).optional(),
    deviceModelId: z.string().optional(),
    isCustomerOwned: z.boolean().optional(),
  })
}

// default schema using English messages for backward compatibility
export const deviceSchema = createDeviceSchema()

export type DeviceFormData = z.infer<ReturnType<typeof createDeviceSchema>>
