import React, { createContext, useContext, useMemo, useState } from 'react'

const RightCtx = createContext(null)
const LeftCtx = createContext(null)

export function RightPaneProvider({ children }) {
  const [node, setNode] = useState(null)
  const api = useMemo(() => ({ setRightPane: setNode, clearRightPane: () => setNode(null) }), [])
  return <RightCtx.Provider value={{ node, ...api }}>{children}</RightCtx.Provider>
}

export function LeftPaneProvider({ children }) {
  const [node, setNode] = useState(null)
  const api = useMemo(() => ({ setLeftPane: setNode, clearLeftPane: () => setNode(null) }), [])
  return <LeftCtx.Provider value={{ node, ...api }}>{children}</LeftCtx.Provider>
}

export function useRightPane() {
  const ctx = useContext(RightCtx)
  if (!ctx) throw new Error('useRightPane must be used within RightPaneProvider')
  return { setRightPane: ctx.setRightPane, clearRightPane: ctx.clearRightPane }
}

export function useRightPaneNode() {
  const ctx = useContext(RightCtx)
  if (!ctx) throw new Error('useRightPane must be used within RightPaneProvider')
  return ctx.node
}

export function useLeftPane() {
  const ctx = useContext(LeftCtx)
  if (!ctx) throw new Error('useLeftPane must be used within LeftPaneProvider')
  return { setLeftPane: ctx.setLeftPane, clearLeftPane: ctx.clearLeftPane }
}

export function useLeftPaneNode() {
  const ctx = useContext(LeftCtx)
  if (!ctx) throw new Error('useLeftPane must be used within LeftPaneProvider')
  return ctx.node
}

export function RightPane() {
  const ctx = useContext(RightCtx)
  return ctx?.node ?? null
}

export function LeftPane() {
  const ctx = useContext(LeftCtx)
  return ctx?.node ?? null
}
