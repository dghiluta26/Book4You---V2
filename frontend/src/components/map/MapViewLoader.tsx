"use client"

import dynamic from "next/dynamic"
import { Component, type ReactNode } from "react"
import { useLanguage } from "@/i18n/LanguageProvider"

// Leaflet touches `window`, so the map is loaded in the browser only (ssr: false).
const LeafletMap = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <MapMessage textKey="map.loading" />,
})

function MapMessage({ textKey, onRetry }: { textKey: "map.loading" | "map.error"; onRetry?: () => void }) {
  const { t } = useLanguage()
  return (
    <div className="flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-3 rounded-2xl bg-warm-gray p-4 text-center text-sm text-subtle">
      <p>{t(textKey)}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="h-9 cursor-pointer rounded-[10px] border border-primary px-4 font-medium text-primary transition-colors hover:bg-primary/8"
        >
          {t("map.retry")}
        </button>
      )}
    </div>
  )
}

/** If the map ever crashes, only the map is replaced by a message: the rest of the page keeps working. */
class MapErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return <MapMessage textKey="map.error" onRetry={() => this.setState({ failed: false })} />
    }
    return this.props.children
  }
}

type MapProps = React.ComponentProps<typeof LeafletMap>

export function MapView(props: MapProps) {
  return (
    <MapErrorBoundary>
      <LeafletMap {...props} />
    </MapErrorBoundary>
  )
}
