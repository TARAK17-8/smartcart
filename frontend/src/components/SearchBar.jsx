import { useState, useRef, useEffect } from 'react'

export default function SearchBar({ value, onChange, onSearch, products }) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState([])
  const inputRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (value.trim().length > 0) {
      const matches = products.filter((p) =>
        p.name.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredProducts(matches)
      setShowSuggestions(matches.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }, [value, products])

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    setShowSuggestions(false)
    onSearch(value)
  }

  const handleSelect = (name) => {
    onChange(name)
    setShowSuggestions(false)
    onSearch(name)
  }

  return (
    <form onSubmit={handleSubmit} ref={wrapperRef} className="relative">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500 text-sm">🔍</span>
          <input
            ref={inputRef}
            id="product-search"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => value.trim() && filteredProducts.length && setShowSuggestions(true)}
            placeholder="Search products — try Rice, Milk, Eggs, Oil..."
            className="search-input w-full rounded-xl border border-surface-700 bg-surface-800/50 py-3 pl-11 pr-4 text-sm text-white placeholder-surface-500 outline-none focus:border-primary-500/50"
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 transition-all hover:shadow-primary-500/30 hover:brightness-110 active:scale-[0.97]"
        >
          Compare
        </button>
      </div>

      {/* Autocomplete suggestions */}
      {showSuggestions && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-surface-700 bg-surface-800/95 py-1 shadow-2xl backdrop-blur-xl">
          {filteredProducts.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelect(p.name)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-surface-300 transition-colors hover:bg-primary-500/10 hover:text-white"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-700/50 text-xs">🏷️</span>
              <span className="font-medium">{p.name}</span>
              <span className="ml-auto rounded-full bg-surface-700/50 px-2 py-0.5 text-[10px] text-surface-500">{p.category}</span>
            </button>
          ))}
        </div>
      )}
    </form>
  )
}
