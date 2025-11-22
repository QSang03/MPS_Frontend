import React from 'react'
import styles from './infoCard.module.css'

type Item = {
  label: string
  value: React.ReactNode
  mono?: boolean
}

type Props = {
  title?: string
  titleIcon?: React.ReactNode
  items?: Item[]
}

export default function InfoCard({ title, titleIcon, items = [] }: Props) {
  return (
    <div className={styles.card}>
      {title && (
        <div className={styles.header}>
          {titleIcon && <span className={styles.icon}>{titleIcon}</span>}
          <div className={styles.title}>{title}</div>
        </div>
      )}

      <div className={styles.grid}>
        {items.map((it) => (
          <div key={String(it.label)} className={styles.item}>
            <div className={styles.label}>{it.label}</div>
            <div
              className={styles.value}
              style={{
                fontFamily: it.mono
                  ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace'
                  : 'inherit',
              }}
            >
              {it.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
