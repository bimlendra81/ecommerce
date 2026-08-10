import { useEffect, useState } from 'react'
import client from '../api/adminClient'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    client
      .get('/admin/users')
      .then(({ data }) => setUsers(data.users))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load users'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function toggleActive(user) {
    setError('')
    try {
      await client.patch(`/admin/users/${user.id}`, { active: user.active ? 0 : 1 })
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user')
    }
  }

  async function toggleRole(user) {
    setError('')
    try {
      await client.patch(`/admin/users/${user.id}`, { role: user.role === 'admin' ? 'user' : 'admin' })
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user')
    }
  }

  async function remove(user) {
    setError('')
    if (!confirm(`Delete "${user.name}"? They will no longer be able to log in.`)) return
    try {
      await client.delete(`/admin/users/${user.id}`)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Users</h1>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.active ? 'Active' : 'Blocked'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => toggleRole(u)} className="text-blue-600 hover:underline mr-3">
                      {u.role === 'admin' ? 'Demote' : 'Make admin'}
                    </button>
                    <button
                      onClick={() => toggleActive(u)}
                      className={u.active ? 'text-red-600 hover:underline mr-3' : 'text-green-600 hover:underline mr-3'}
                    >
                      {u.active ? 'Block' : 'Unblock'}
                    </button>
                    <button onClick={() => remove(u)} className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
