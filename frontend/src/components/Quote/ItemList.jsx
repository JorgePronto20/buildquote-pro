import Button from '../UI/Button'
import { formatMoney, itemSubtotal, itemTotal } from '../../utils/money'

export default function ItemList({ items = [], onRemove }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50"><tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Descrição</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Tipo</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">Qtd</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">Preço</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">IVA</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">Subtotal</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">Total</th>
            <th className="px-4 py-3"></th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <tr key={item.local_id || item.id} className="hover:bg-blue-50">
                <td className="px-4 py-3 font-medium text-gray-900">{item.description}</td>
                <td className="px-4 py-3 text-gray-500">{item.item_type}</td>
                <td className="px-4 py-3 text-right">{item.quantity} {item.unit}</td>
                <td className="px-4 py-3 text-right">{formatMoney(item.unit_price || item.unit_cost)}</td>
                <td className="px-4 py-3 text-right">{item.vat_rate}%</td>
                <td className="px-4 py-3 text-right">{formatMoney(item.subtotal ?? itemSubtotal(item))}</td>
                <td className="px-4 py-3 text-right font-bold">{formatMoney(item.total ?? itemTotal(item))}</td>
                <td className="px-4 py-3 text-right"><Button variant="ghost" className="px-2 text-red-600" onClick={() => onRemove(item.local_id || item.id)}>Remover</Button></td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">Ainda não existem itens nesta zona.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
