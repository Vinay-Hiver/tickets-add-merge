import { Children, createContext, isValidElement, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '../../components/Button'
import { Dropdown } from '../../components/Dropdown'
import { startRipple } from '../../components/ripple'
import { Tooltip } from '../../components/Tooltip'
import { Icon } from '../../icons/Icon'
import type { IconName } from '../../icons/iconData'
import './RightPanel.css'

/* ---------- Panel ---------- */

/** One tab in the bar at the top of the panel: an icon on its own, with a name shown as a tooltip. */
export type RightPanelTab = { id: string; label: string; icon: IconName }

export type RightPanelProps = {
  /** The tab bar at the very top. The panel's content starts below it. Leave out for a panel without a bar. */
  tabs?: RightPanelTab[]
  /** The selected tab's id, when you control it yourself. The first tab is selected at first. */
  activeTab?: string
  onTabChange?: (id: string) => void
  /** The top section (see `RightPanelTop`), followed by the sub-sections (see `RightPanelSection`). Each sub-section needs an `id`. */
  children: ReactNode
  /** Called with the sub-section ids in their new order when one is dragged to a new place. */
  onReorder?: (ids: string[]) => void
  /** Shows the "Customize widgets" button after the last section. It opens a list of the sections with a checkbox each; only the ticked ones show in the panel. */
  customizeWidgets?: boolean
  /** The ids of the sections that are shown, when you control it yourself. Leave out to show all of them at first. */
  visibleIds?: string[]
  /** Called with the ids of the shown sections when the person ticks or unticks one. */
  onVisibleChange?: (ids: string[]) => void
  /** Accessible name for the panel. */
  'aria-label'?: string
  className?: string
  /**
   * A second group after the sections, for example the conversation inside a ticket: its own top block (`heading`) and
   * sections. "Customize widgets" then lists both groups, the first under `title`, this one under `secondary.title`.
   */
  secondary?: { title: string; heading?: ReactNode; sections: ReactNode }
  /** With `secondary`: the name of the first group in "Customize widgets". */
  title?: string
}

/** What a sortable wrapper hands to the section inside it: the props that make the drag handle start a drag. */
type SortableHandle = { handleProps: Record<string, unknown>; isDragging: boolean }
const SortableContextHandle = createContext<SortableHandle | null>(null)

/**
 * One sub-section in the list. While it is dragged the section itself follows the pointer, folded up, and the other sections
 * slide out of the way (translate only, never scaled). This is the same logic as the omni-boilerplate right panel.
 */
function SortableSection({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      className={`hot-rp-sortable${isDragging ? ' hot-rp-sortable--dragging' : ''}`}
      style={{ transform: CSS.Translate.toString(transform), transition, zIndex: isDragging ? 2 : undefined }}
    >
      <SortableContextHandle.Provider value={{ handleProps: { ...attributes, ...listeners }, isDragging }}>{children}</SortableContextHandle.Provider>
    </div>
  )
}

/**
 * The panel on the right of a page. Always 320px wide. Every channel uses the same anatomy: a top section, then sub-sections
 * that open and close and that can be dragged by their handle to a new order (up and down only).
 */
export function RightPanel({ tabs, activeTab, onTabChange, children, onReorder, customizeWidgets, visibleIds, onVisibleChange, className, secondary, title, ...rest }: RightPanelProps) {
  const [innerTab, setInnerTab] = useState(tabs?.[0]?.id)
  const selectedTab = activeTab ?? innerTab
  const nodes = Children.toArray(children)
  // Found by a marker on the component (not by comparing the component itself), so it still works after a live reload while editing.
  const isSection = (n: ReactNode): n is ReactElement<RightPanelSectionProps> => isValidElement(n) && (n.type as { isRightPanelSection?: boolean }).isRightPanelSection === true
  const sections = nodes.filter(isSection)
  const others = nodes.filter((n) => !isSection(n))
  const ids = sections.map((n) => String(n.props.id))

  // Keep the order the person dragged to, and add or drop sections that were added or removed.
  const [order, setOrder] = useState(ids)
  const current = [...order.filter((id) => ids.includes(id)), ...ids.filter((id) => !order.includes(id))]
  const byId = new Map(sections.map((n) => [String(n.props.id), n]))

  // Which sections are shown. All of them at first; "Customize widgets" changes this.
  const [shown, setShown] = useState<string[] | undefined>(undefined)
  const shownIds = visibleIds ?? shown ?? ids
  const visible = current.filter((id) => shownIds.includes(id))
  const setVisible = (next: string[]) => {
    // Keep the sections in the order they are in now.
    const ordered = current.filter((id) => next.includes(id))
    setShown(ordered)
    onVisibleChange?.(ordered)
  }

  // The second group keeps its own order and visibility, changed from "Customize widgets".
  const secondarySections = Children.toArray(secondary?.sections).filter(isSection)
  const secondaryIds = secondarySections.map((n) => String(n.props.id))
  const secondaryById = new Map(secondarySections.map((n) => [String(n.props.id), n]))
  const [secondaryOrder, setSecondaryOrder] = useState(secondaryIds)
  const secondaryCurrent = [...secondaryOrder.filter((id) => secondaryIds.includes(id)), ...secondaryIds.filter((id) => !secondaryOrder.includes(id))]
  const [secondaryShown, setSecondaryShown] = useState<string[] | undefined>(undefined)
  const secondaryShownIds = secondaryShown ?? secondaryIds

  // Dragging starts after 5px of movement on the handle.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    // Move within the sections that are shown, then put the hidden ones back where they were.
    const moved = arrayMove(visible, visible.indexOf(String(active.id)), visible.indexOf(String(over.id)))
    let k = 0
    const next = current.map((id) => (shownIds.includes(id) ? moved[k++] : id))
    setOrder(next)
    onReorder?.(next)
  }

  return (
    <aside className={['hot-right-panel', className].filter(Boolean).join(' ')} {...rest}>
      {tabs && tabs.length > 0 && (
        <div className="hot-rp-tabs" role="tablist" aria-label="Panel views">
          {tabs.map((t) => (
            <Tooltip key={t.id} content={t.label} placement="bottom" portal>
              <button
                type="button"
                role="tab"
                className="hot-rp-tab"
                aria-selected={t.id === selectedTab}
                aria-label={t.label}
                onMouseDown={startRipple}
                onClick={() => { setInnerTab(t.id); onTabChange?.(t.id) }}
              >
                <Icon name={t.icon} size={16} />
              </button>
            </Tooltip>
          ))}
        </div>
      )}
      {/* The content starts below the tab bar and scrolls on its own. */}
      <div className="hot-rp-body">
      {others}
      <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis, restrictToParentElement]} onDragEnd={onDragEnd}>
        <SortableContext items={visible} strategy={verticalListSortingStrategy}>
          <div className="hot-rp-sections">
            {visible.map((id) => <SortableSection key={id} id={id}>{byId.get(id)}</SortableSection>)}
          </div>
        </SortableContext>
      </DndContext>
      {secondary && (
        <>
          {secondary.heading}
          <div className="hot-rp-sections">
            {secondaryCurrent.filter((id) => secondaryShownIds.includes(id)).map((id) => <div key={id}>{secondaryById.get(id)}</div>)}
          </div>
        </>
      )}
      {customizeWidgets && (
        <CustomizeWidgets
          groups={[
            {
              title: secondary ? title : undefined,
              options: current.map((id) => ({ value: id, label: String(byId.get(id)?.props.title ?? id) })),
              selected: shownIds,
              onChange: setVisible,
              onReorder: (next) => { setOrder(next); onReorder?.(next) },
            },
            ...(secondary ? [{
              title: secondary.title,
              options: secondaryCurrent.map((id) => ({ value: id, label: String(secondaryById.get(id)?.props.title ?? id) })),
              selected: secondaryShownIds,
              onChange: (ids: string[]) => setSecondaryShown(secondaryCurrent.filter((id) => ids.includes(id))),
              onReorder: setSecondaryOrder,
            }] : []),
          ]}
        />
      )}
      </div>
    </aside>
  )
}

/* ---------- Customize widgets ---------- */

/**
 * The button after the last section. It opens a flyout above it: the Dropdown (checkbox style) with the section names.
 * The names can be dragged into a new order, and the panel follows.
 * The flyout is placed here by hand, because there is no popover component yet.
 */
type WidgetGroup = { title?: string; options: { value: string; label: string }[]; selected: string[]; onChange: (ids: string[]) => void; onReorder: (ids: string[]) => void }

function CustomizeWidgets({ groups }: { groups: WidgetGroup[] }) {
  const [open, setOpen] = useState(false)
  // Where the top of the button was when the flyout opened, in the panel's own coordinates. The flyout stays at this spot
  // while it is open, even if the button moves because sections were hidden or shown. It only changes when it is opened again.
  const [anchor, setAnchor] = useState(0)
  const [top, setTop] = useState<number | undefined>(undefined)
  const footerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLDivElement>(null)
  const flyoutRef = useRef<HTMLDivElement>(null)

  const toggle = () => {
    if (!open && footerRef.current && buttonRef.current) {
      setAnchor(buttonRef.current.offsetTop) // relative to the panel, which is the nearest positioned parent
      setTop(undefined)
    }
    setOpen((o) => !o)
  }

  // Once the flyout is on the page, put its bottom edge 8px above where the button was. This runs before the screen is painted.
  useLayoutEffect(() => {
    if (open && top === undefined && flyoutRef.current) setTop(anchor - 8 - flyoutRef.current.offsetHeight)
  }, [open, top, anchor])

  // Close on a click outside, or on Escape.
  useEffect(() => {
    if (!open) return undefined
    const onDown = (e: MouseEvent) => {
      const inside = (n: Node | null) => !!n && (footerRef.current?.contains(n) || flyoutRef.current?.contains(n))
      if (!inside(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      {open && (
        <div ref={flyoutRef} className="hot-rp-flyout" style={{ top: top ?? 0, visibility: top === undefined ? 'hidden' : 'visible' }}>
          {groups.length === 1 ? (
            <Dropdown className="hot-rp-flyout__list" variant="checkbox" title="Customize widgets" options={groups[0].options} value={groups[0].selected} onChange={(v) => groups[0].onChange(v as string[])} reorderable onReorder={groups[0].onReorder} />
          ) : (
            // More than one group: one panel with the title, then each group under its name, split by a line.
            <div className="hot-dropdown hot-dropdown--no-search hot-dropdown--no-actions hot-rp-flyout__list hot-rp-flyout__grouped">
              <div className="hot-dropdown__title">Customize widgets</div>
              {groups.map((g) => (
                <div key={g.title} className="hot-rp-flyout__group">
                  <div className="hot-rp-flyout__group-title">{g.title}</div>
                  <Dropdown className="hot-rp-flyout__group-list" variant="checkbox" options={g.options} value={g.selected} onChange={(v) => g.onChange(v as string[])} reorderable onReorder={g.onReorder} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="hot-rp-footer" ref={footerRef}>
        <div ref={buttonRef} className="hot-rp-footer__slot">
          <Button variant="secondary-filled" size="sm" className="hot-rp-footer__button" aria-haspopup="dialog" aria-expanded={open} iconLeft={<Icon name="setting" size={14} />} onClick={toggle}>
            Customize widgets
          </Button>
        </div>
      </div>
    </>
  )
}

/* ---------- Top section ---------- */

export type RightPanelTopProps = {
  /** The heading, for example the inbox name. */
  title: string
  /** The rows under the heading. Each row is `<div className="hot-rp-field">` with an icon and label on the left and the value on the right (see the Docs page). */
  children?: ReactNode
  /** Shown between the heading and the rows, for example an SLA alert. */
  alert?: ReactNode
}

export function RightPanelTop({ title, children, alert }: RightPanelTopProps) {
  return (
    <section className="hot-rp-top">
      <h2 className="hot-rp-top__title">{title}</h2>
      {alert}
      <div className="hot-rp-fields">{children}</div>
    </section>
  )
}

/* ---------- Sub-section ---------- */

export type RightPanelSectionProps = {
  /** A unique id. It is how the section is told apart when the sections are reordered. */
  id: string
  /** The section name, for example "Contact". */
  title: string
  /** The icon before the name: a HOT icon name, or a 16px icon element for one the HOT set does not have. */
  icon: IconName | ReactElement
  /** The section's rows. Shown when the section is open. */
  children?: ReactNode
  /** Starts open when set. Used when the section manages itself. */
  defaultExpanded?: boolean
  /** Open or closed, when you control it yourself. */
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  /** Storybook only: pins the hover look on the header. */
  forceHover?: boolean
}

export function RightPanelSection({ title, icon, children, defaultExpanded = false, expanded, onExpandedChange, forceHover }: RightPanelSectionProps) {
  const handle = useContext(SortableContextHandle)
  const [inner, setInner] = useState(defaultExpanded)
  // A section that is being dragged folds up, and opens again where it lands.
  const open = (expanded ?? inner) && !handle?.isDragging
  const bodyId = useId()
  const toggle = () => {
    setInner(!open)
    onExpandedChange?.(!open)
  }
  return (
    <section className="hot-rp-section" data-open={open}>
      <div className="hot-rp-section__header" data-force-state={forceHover ? 'hover' : undefined}>
        {/* The drag handle sits in the left gutter and shows on hover, open or closed. Only the handle starts a drag. */}
        {handle && (
          <button type="button" className="hot-rp-section__grip" aria-label="Drag to reorder" {...(handle.handleProps as object)}>
            <Icon name="drag" size={14} />
          </button>
        )}
        <button type="button" className="hot-rp-section__toggle" aria-expanded={open} aria-controls={bodyId} onClick={toggle}>
          <span className="hot-rp-section__icon">{typeof icon === 'string' ? <Icon name={icon} size={16} /> : icon}</span>
          <span className="hot-rp-section__title">{title}</span>
          <span className="hot-rp-section__chevron" aria-hidden="true"><Icon name="chevronright" size={16} /></span>
        </button>
      </div>
      {/* Opening and closing slides over 250ms, like the Conversations sidebar inboxes. */}
      <div className="hot-rp-section__wrap" data-open={open} id={bodyId}>
        <div className="hot-rp-section__body">
          <div className="hot-rp-section__inner">
            <div className="hot-rp-fields">{children}</div>
          </div>
        </div>
      </div>
    </section>
  )
}

RightPanelSection.isRightPanelSection = true
