"use client"

import Image from "next/image"
import { useState } from "react"
import { useLanguage } from "@/i18n/LanguageProvider"
import { cn } from "@/lib/utils"
import type { AccommodationImage } from "@/types/accommodation"

/** Big photo plus clickable thumbnails. */
export function Gallery({ images, title }: { images: AccommodationImage[]; title: string }) {
  const { t } = useLanguage()
  const [selected, setSelected] = useState(0)

  if (images.length === 0) {
    return <div className="aspect-[16/10] w-full rounded-2xl bg-muted-green" />
  }

  return (
    <div>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-muted-green">
        <Image
          src={images[selected].url}
          alt={title}
          fill
          unoptimized
          priority
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((image, index) => (
            <li key={image.url}>
              <button
                type="button"
                onClick={() => setSelected(index)}
                aria-label={t("details.photo", { n: index + 1 })}
                aria-current={index === selected}
                className={cn(
                  "relative block aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-xl bg-muted-green outline-offset-2 transition-opacity",
                  index === selected ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100",
                )}
              >
                <Image src={image.url} alt="" fill unoptimized sizes="160px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
