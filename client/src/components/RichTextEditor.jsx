import { useEffect, useRef, useState } from 'react'

function Icon({ children, viewBox = '0 0 24 24' }) {
  return (
    <svg viewBox={viewBox} className="h-4 w-4" fill="currentColor" aria-hidden="true">
      {children}
    </svg>
  )
}

function ToolbarButton({ title, active, onMouseDown, children }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault()
        onMouseDown()
      }}
      className={`min-w-8 h-8 px-1.5 rounded flex items-center justify-center hover:bg-gray-100 ${
        active ? 'bg-gray-200 ring-1 ring-gray-300' : 'text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span className="w-px h-5 bg-gray-300 mx-1 self-center" />
}

export default function RichTextEditor({ value = '', onChange, placeholder = 'Write...' }) {
  const editorRef = useRef(null)
  const [active, setActive] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
  })
  const [tableMenuOpen, setTableMenuOpen] = useState(false)
  const [tableSize, setTableSize] = useState({ r: 3, c: 3 })
  const tableMenuRef = useRef(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  useEffect(() => {
    if (!tableMenuOpen) return
    function close(e) {
      if (tableMenuRef.current && !tableMenuRef.current.contains(e.target)) {
        setTableMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [tableMenuOpen])

  useEffect(() => {
    function updateActive() {
      setActive({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strike: document.queryCommandState('strikeThrough'),
      })
    }
    document.addEventListener('selectionchange', updateActive)
    return () => document.removeEventListener('selectionchange', updateActive)
  }, [])

  function emit() {
    onChange(editorRef.current?.innerHTML || '')
  }

  function run(cmd, arg) {
    editorRef.current?.focus()
    document.execCommand(cmd, false, arg)
    emit()
  }

  function addLink() {
    const url = window.prompt('Enter link URL', 'https://')
    if (url) run('createLink', url)
  }

  function insertTable(rows = 3, cols = 3) {
    const cells = Array.from(
      { length: cols },
      () => '<td style="border:1px solid #d1d5db;padding:6px 10px">&nbsp;</td>'
    ).join('')
    const trs = Array.from(
      { length: rows },
      () => `<tr>${cells}</tr>`
    ).join('')
    const table = `<table style="width:100%;border-collapse:collapse;border:1px solid #d1d5db;margin:0.5rem 0"><tbody>${trs}</tbody></table><p>&nbsp;</p>`
    run('insertHTML', table)
  }

  function findCell() {
    const sel = document.getSelection()
    if (!sel || sel.rangeCount === 0) return null
    let node = sel.getRangeAt(0).commonAncestorContainer
    if (node.nodeType === 3) node = node.parentElement
    return node && node.closest ? node.closest('td') : null
  }

  function insertTableRow(above) {
    const cell = findCell()
    if (!cell) return
    const row = cell.closest('tr')
    const tbody = row.parentElement
    const colCount = row.cells.length
    const newRow = tbody.insertRow(row.rowIndex + (above ? 0 : 1))
    for (let i = 0; i < colCount; i++) {
      const td = newRow.insertCell()
      td.innerHTML = '&nbsp;'
      td.style.border = '1px solid #d1d5db'
      td.style.padding = '6px 10px'
    }
    emit()
  }

  function insertTableColumn(left) {
    const cell = findCell()
    if (!cell) return
    const table = cell.closest('table')
    const colIndex = cell.cellIndex
    for (const row of table.rows) {
      const td = row.insertCell(colIndex + (left ? 0 : 1))
      td.innerHTML = '&nbsp;'
      td.style.border = '1px solid #d1d5db'
      td.style.padding = '6px 10px'
    }
    emit()
  }

  function deleteTableRow() {
    const cell = findCell()
    if (!cell) return
    cell.closest('tr').remove()
    emit()
  }

  function deleteTableColumn() {
    const cell = findCell()
    if (!cell) return
    const table = cell.closest('table')
    const colIndex = cell.cellIndex
    for (const row of table.rows) {
      if (row.cells[colIndex]) row.deleteCell(colIndex)
    }
    emit()
  }

  function deleteTable() {
    const cell = findCell()
    if (!cell) return
    cell.closest('table').remove()
    emit()
  }

  function tableAction(fn) {
    fn()
    setTableMenuOpen(false)
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50">
        <ToolbarButton title="Bold (Ctrl+B)" active={active.bold} onMouseDown={() => run('bold')}>
          <Icon><path d="M7 4h6a3 3 0 0 1 0 6H7zM7 14h7a3 3 0 0 1 0 6H7z" fillRule="evenodd" /></Icon>
        </ToolbarButton>
        <ToolbarButton title="Italic (Ctrl+I)" active={active.italic} onMouseDown={() => run('italic')}>
          <Icon><path d="M10 4h7l-4 16H6z" /></Icon>
        </ToolbarButton>
        <ToolbarButton title="Underline (Ctrl+U)" active={active.underline} onMouseDown={() => run('underline')}>
          <Icon><path d="M7 4v7a5 5 0 0 0 10 0V4M5 20h14" fill="none" stroke="currentColor" strokeWidth="2" /></Icon>
        </ToolbarButton>
        <ToolbarButton title="Strikethrough" active={active.strike} onMouseDown={() => run('strikeThrough')}>
          <Icon><path d="M6 5h12M6 12h12M6 19h12M9 12a3 3 0 0 1 6 0" fill="none" stroke="currentColor" strokeWidth="2" /></Icon>
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="Heading 1" onMouseDown={() => run('formatBlock', 'H1')}>
          <span className="text-xs font-bold">H1</span>
        </ToolbarButton>
        <ToolbarButton title="Heading 2" onMouseDown={() => run('formatBlock', 'H2')}>
          <span className="text-xs font-bold">H2</span>
        </ToolbarButton>
        <ToolbarButton title="Heading 3" onMouseDown={() => run('formatBlock', 'H3')}>
          <span className="text-xs font-bold">H3</span>
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="Bullet list" onMouseDown={() => run('insertUnorderedList')}>
          <Icon><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" /><circle cx="2.5" cy="6" r="1.3" /><circle cx="2.5" cy="12" r="1.3" /><circle cx="2.5" cy="18" r="1.3" /></Icon>
        </ToolbarButton>
        <ToolbarButton title="Numbered list" onMouseDown={() => run('insertOrderedList')}>
          <Icon><path d="M8 6h13M8 12h13M8 18h13" stroke="currentColor" strokeWidth="2" /><path d="M3 4v3h2M3 11l2-1.5L5 14M4 16h2v4H3" fill="none" stroke="currentColor" strokeWidth="1.6" /></Icon>
        </ToolbarButton>
        <ToolbarButton title="Quote" onMouseDown={() => run('formatBlock', 'BLOCKQUOTE')}>
          <Icon><path d="M5 5h6v6H7a3 3 0 0 0 3 3v2a5 5 0 0 1-5-5V5zm10 0h6v6h-4a3 3 0 0 0 3 3v2a5 5 0 0 1-5-5V5z" /></Icon>
        </ToolbarButton>
        <div className="relative" ref={tableMenuRef}>
          <button
            type="button"
            title="Insert / edit table"
            onClick={() => setTableMenuOpen((o) => !o)}
            className={`min-w-8 h-8 px-1.5 rounded flex items-center justify-center hover:bg-gray-100 ${
              tableMenuOpen ? 'bg-gray-200 ring-1 ring-gray-300' : 'text-gray-700'
            }`}
          >
            <Icon><path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 10h16M10 4v16" fill="none" stroke="currentColor" strokeWidth="1.8" /></Icon>
          </button>
          {tableMenuOpen && (
            <div className="absolute left-0 top-full mt-1 z-30 w-64 bg-white border border-gray-200 rounded-lg shadow-xl p-3">
              <p className="text-xs font-semibold text-gray-600 mb-2">Insert table</p>
              <div
                className="grid grid-cols-8 gap-1"
                onMouseLeave={() => setTableSize({ r: 3, c: 3 })}
              >
                {Array.from({ length: 6 }).map((_, r) =>
                  Array.from({ length: 8 }).map((_, c) => (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      title={`${r + 1} x ${c + 1}`}
                      onMouseEnter={() => setTableSize({ r: r + 1, c: c + 1 })}
                      onClick={() => tableAction(() => insertTable(r + 1, c + 1))}
                      className={`h-4 w-4 rounded-sm transition-colors ${
                        r < tableSize.r && c < tableSize.c
                          ? 'bg-primary'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    />
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {tableSize.r} x {tableSize.c} table
              </p>
              <div className="border-t border-gray-100 mt-3 pt-2 space-y-0.5">
                <p className="text-xs font-semibold text-gray-600 mb-1">Edit selected table</p>
                {[
                  ['Insert row above', () => insertTableRow(true)],
                  ['Insert row below', () => insertTableRow(false)],
                  ['Insert column left', () => insertTableColumn(true)],
                  ['Insert column right', () => insertTableColumn(false)],
                  ['Delete row', deleteTableRow],
                  ['Delete column', deleteTableColumn],
                  ['Delete table', deleteTable],
                ].map(([label, fn]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => tableAction(fn)}
                    className="w-full text-left px-2 py-1.5 rounded text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Divider />

        <ToolbarButton title="Add link" onMouseDown={addLink}>
          <Icon><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7L12.5 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></Icon>
        </ToolbarButton>
        <ToolbarButton title="Remove link" onMouseDown={() => run('unlink')}>
          <Icon><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1M4 4l16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></Icon>
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="Undo" onMouseDown={() => run('undo')}>
          <Icon><path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Icon>
        </ToolbarButton>
        <ToolbarButton title="Redo" onMouseDown={() => run('redo')}>
          <Icon><path d="m15 14 5-5-5-5M20 9H10a6 6 0 0 0 0 12h3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Icon>
        </ToolbarButton>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={emit}
        className="rich-text min-h-40 p-4 text-sm focus:outline-none"
      />
    </div>
  )
}
