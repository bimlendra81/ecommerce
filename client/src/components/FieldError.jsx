export default function FieldError({ name, errors, className = 'text-sm text-red-600 ' }) {
  if (!errors || !errors[name]) return null
  return <p className={className} >{errors[name]}</p>
}
