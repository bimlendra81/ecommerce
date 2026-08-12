import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  closeCartPanel,
  openCartPanel,
  selectCartCount,
  selectCartPanelOpen,
} from '../features/cartSlice'
import CartPanelContent from './cart/CartPanelContent'

export default function FloatingCart() {
  const dispatch = useDispatch()
  const count = useSelector(selectCartCount)
  const open = useSelector(selectCartPanelOpen)
  const [closing, setClosing] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    if (open && count === 0) {
      setClosing(false)
      dispatch(closeCartPanel())
    }
  }, [open, count, dispatch])

  useEffect(() => () => clearTimeout(timer.current), [])

  function close() {
    if (closing) return
    setClosing(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      dispatch(closeCartPanel())
      setClosing(false)
    }, 280)
  }

  function toggle() {
    if (open) close()
    else dispatch(openCartPanel())
  }

  if (count === 0) return null

  return (
    <>
      <button
        onClick={toggle}
        aria-label={open ? 'Close cart' : `Open cart (${count} ${count === 1 ? 'item' : 'items'})`}
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-primary text-white shadow-lg hover:bg-primary-dark transition-colors flex items-center justify-center"
      >
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        <span className="absolute -top-1 -right-1 bg-accent text-white text-xs font-bold rounded-full h-6 min-w-6 px-1 flex items-center justify-center border-2 border-white">
          {count}
        </span>
      </button>

      {open && (
        <div
          className={`fixed bottom-24 right-5 z-50 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border-2 border-primary overflow-hidden ${
            closing ? 'cart-popup-out' : 'cart-popup-in'
          }`}
        >
          <div className="flex items-start justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-gray-800 font-semibold text-sm">
              Your Cart <span className="font-normal text-gray-500">({count} {count === 1 ? 'item' : 'items'})</span>
            </p>
            <button
              onClick={close}
              className="text-gray-400 hover:text-gray-700 text-lg leading-none"
              aria-label="Close cart"
            >
              ✕
            </button>
          </div>
          <CartPanelContent onClose={close} />
        </div>
      )}
    </>
  )
}
