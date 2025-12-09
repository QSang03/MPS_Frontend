'use client'
import React from 'react'
import Image from 'next/image'
import styles from './deviceHeader.module.css'
import { useLocale } from '@/components/providers/LocaleProvider'

type Device = {
  name?: string
  model?: string
  iconUrl?: string
  active?: boolean
}

type Props = {
  device?: Device
  onPrimaryAction?: () => void
  rightContent?: React.ReactNode
  onSecondaryAction?: () => void
}

export default function DeviceHeader({ device = {}, onPrimaryAction, rightContent }: Props) {
  const { name = '---', model = '', iconUrl, active = false } = device
  const { t } = useLocale()

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.iconWrap}>
          {iconUrl ? (
            <Image src={iconUrl} alt="device" className={styles.icon} width={48} height={48} />
          ) : (
            <div className={styles.iconPlaceholder} />
          )}
        </div>
        <div className={styles.meta}>
          <div className={styles.title}>{name}</div>
          {model ? <div className={styles.subtitle}>{model}</div> : null}
        </div>
      </div>

      <div className={styles.right}>
        {/** If parent supplies rightContent, render it; otherwise render default status + primary button */}
        {rightContent ? (
          rightContent
        ) : (
          <>
            <span
              className={styles.status}
              style={{
                background: active ? 'rgba(16,185,129,0.12)' : '#f3f4f6',
                color: active ? '#065f46' : '#6b7280',
                borderColor: active ? 'transparent' : '#e5e7eb',
              }}
            >
              {active ? t('device.status.active') : t('device.status.inactive')}
            </span>

            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => onPrimaryAction && onPrimaryAction()}
            >
              {t('device.action.create_request')}
            </button>
          </>
        )}
      </div>
    </header>
  )
}
