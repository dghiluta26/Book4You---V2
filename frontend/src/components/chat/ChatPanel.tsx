"use client"

import { Sparkles } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { useLanguage } from "@/i18n/LanguageProvider"
import type { TranslationKey } from "@/i18n/dictionaries"
import { parseChat } from "@/lib/api"
import { criteriaFromFilters, filtersFromCriteria } from "@/lib/chat-criteria"
import { filtersFromParams, filtersToQuery } from "@/lib/search-filters"
import { cn } from "@/lib/utils"
import type { ChatResponse, SearchCriteria } from "@/types/chat"
import { FilterChips } from "./FilterChips"

type Message = {
  id: number
  from: "user" | "assistant"
  /** Text from the user or the server's question... */
  text?: string
  /** ...or texts translated in the current UI language. */
  keys?: TranslationKey[]
}

const MAX_LENGTH = 500
const MAX_MESSAGES = 8

function replyFor(response: ChatResponse): Omit<Message, "id"> {
  const keys: TranslationKey[] = []
  if (response.warnings.includes("llm_unavailable")) keys.push("chat.fallbackNotice")
  if (response.warnings.includes("dates_ignored")) keys.push("chat.datesIgnored")
  if (!response.clarification) keys.push("chat.understood")
  return { from: "assistant", text: response.clarification ?? undefined, keys }
}

/**
 * The chatbot: the user describes the trip, the API returns filters, and they appear as editable
 * chips. The URL stays the single source of truth, so every change reruns the classic search,
 * and the search keeps working even when the assistant does not.
 */
export function ChatPanel() {
  const { t, locale } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const filters = filtersFromParams(searchParams)
  const queryString = filtersToQuery(filters).toString()

  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [activities, setActivities] = useState<string[]>([])
  const [pending, setPending] = useState(false)
  // Filters waiting for a destination. They are dropped if the search changes in the meantime.
  const [waiting, setWaiting] = useState<{ criteria: SearchCriteria; query: string } | null>(null)

  const nextId = useRef(0)
  const request = useRef<AbortController | null>(null)
  const log = useRef<HTMLUListElement>(null)

  // Leaving the page cancels a request still running, so it cannot navigate later.
  useEffect(
    () => () => {
      request.current?.abort()
      setPending(false)
    },
    [],
  )

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight })
  }, [messages, pending])

  const draft = waiting?.query === queryString ? waiting.criteria : null
  const shown = draft ?? criteriaFromFilters(filters, activities)

  function add(message: Omit<Message, "id">) {
    nextId.current += 1
    const id = nextId.current
    setMessages((list) => [...list, { ...message, id }].slice(-MAX_MESSAGES))
  }

  function search(criteria: SearchCriteria) {
    setActivities(criteria.activities)
    setWaiting(null)
    const query = filtersToQuery(filtersFromCriteria(criteria, filters.sort)).toString()
    router.push(query ? `/accommodations?${query}` : "/accommodations", { scroll: false })
  }

  /** A chip was edited or removed. */
  function handleChips(next: SearchCriteria) {
    // Still waiting for a destination: keep collecting until we have one.
    if (draft && !next.destination) setWaiting({ criteria: next, query: queryString })
    else search(next)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const message = input.trim()
    if (!message || pending) return

    add({ from: "user", text: message })
    setInput("")
    setPending(true)
    const controller = new AbortController()
    request.current = controller
    try {
      const response = await parseChat(message, locale, shown, controller.signal)
      add(replyFor(response))
      if (response.missing.length > 0) {
        setWaiting({ criteria: response.criteria, query: queryString })
      } else {
        search(response.criteria)
      }
    } catch {
      if (controller.signal.aborted) return
      add({ from: "assistant", keys: ["chat.error"] })
      setInput(message) // let the user retry without typing again
    }
    setPending(false)
  }

  function handleClear() {
    request.current?.abort()
    setPending(false)
    setMessages([])
    setActivities([])
    setWaiting(null)
    router.push("/accommodations", { scroll: false })
  }

  return (
    <section id="assistant" aria-label={t("chat.title")} className="mb-8 rounded-2xl bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="size-5 text-primary" />
            {t("chat.title")}
          </h2>
          <p className="text-sm text-subtle">{t("chat.subtitle")}</p>
        </div>
        {(messages.length > 0 || draft) && (
          <button
            type="button"
            onClick={handleClear}
            className="h-9 cursor-pointer rounded-[10px] border border-primary px-4 text-sm font-medium text-primary hover:bg-primary/8"
          >
            {t("chat.clear")}
          </button>
        )}
      </div>

      {(messages.length > 0 || pending) && (
        <ul ref={log} aria-live="polite" className="mt-4 max-h-64 space-y-2 overflow-y-auto">
          {messages.map((message) => (
            <li key={message.id} className={cn("flex", message.from === "user" && "justify-end")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-4 py-2 text-sm",
                  message.from === "user" ? "bg-primary text-cream" : "bg-warm-gray text-body",
                )}
              >
                {message.keys?.map((key) => <p key={key}>{t(key)}</p>)}
                {message.text && <p className="break-words whitespace-pre-wrap">{message.text}</p>}
              </div>
            </li>
          ))}
          {pending && (
            <li className="flex">
              <div role="status" className="flex items-center gap-2 rounded-xl bg-warm-gray px-4 py-3 text-sm text-subtle">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="size-2 animate-bounce rounded-full bg-primary"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
                <span className="ml-1">{t("chat.thinking")}</span>
              </div>
            </li>
          )}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={input}
          maxLength={MAX_LENGTH}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t("chat.placeholder")}
          aria-label={t("chat.subtitle")}
          className="h-[52px] w-full rounded-[14px] bg-field px-4 text-body outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className="h-[52px] shrink-0 cursor-pointer rounded-[10px] bg-primary px-8 font-bold text-cream transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("chat.send")}
        </button>
      </form>

      <div className="mt-4 empty:hidden">
        <FilterChips criteria={shown} needsDestination={draft !== null} onChange={handleChips} />
      </div>
    </section>
  )
}
