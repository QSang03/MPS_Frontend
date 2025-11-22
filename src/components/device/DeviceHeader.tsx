import React from 'react'
import styles from './deviceHeader.module.css'

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

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.iconWrap}>
          {iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={iconUrl} alt="device" className={styles.icon} />
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
        {/** eslint-disable-next-line react/no-danger */}
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
              {active ? 'Active' : 'Inactive'}
            </span>

            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => onPrimaryAction && onPrimaryAction()}
            >
              Tạo yêu cầu
            </button>
          </>
        )}
      </div>
    </header>
  )
}
