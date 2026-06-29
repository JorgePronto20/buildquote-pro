import { useEffect, useMemo, useState } from 'react'
import { catalogApi } from '../api/catalog'
import Button from '../components/UI/Button'
import EmptyState from '../components/UI/EmptyState'
import Input from '../components/UI/Input'
import Modal from '../components/UI/Modal'
import Select from '../components/UI/Select'
import { PROFESSIONS, professionLabel } from '../utils/constants'
import { formatMoney } from '../utils/money'

const emptyMaterial = {
  code: '',
  name: '',
  description: '',
  category: '',
  subcategory: '',
  profession: '',
  brand_id: '',
  series_id: '',
  unit: 'un',
  base_price: 0,
  vat_rate: 23,
  color: '',
  finish: '',
  image_url: '',
  is_active: 1,
}

function materialName(material) {
  return material.name || material.description || material.code || 'Material'
}

export default function Catalog() {
  {/* @section: catalog-state */}
  const [brands, setBrands] = useState([])
  const [series, setSeries] = useState([])
  const [materials, setMaterials] = useState([])
  const [filters, setFilters] = useState({ brand_id: '', series_id: '', category: '', profession: '', q: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [compatibles, setCompatibles] = useState([])
  const [compatLoading, setCompatLoading] = useState(false)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyMaterial)

  async function loadBrands() {
    const data = await catalogApi.brands()
    setBrands(data.brands || [])
  }

  async function loadSeries(brandId) {
    if (!brandId) {
      setSeries([])
      return
    }
    const data = await catalogApi.series(brandId)
    setSeries(data.series || [])
  }

  async function loadMaterials() {
    setLoading(true)
    setError('')
    try {
      const data = await catalogApi.materials(filters)
      setMaterials(data.materials || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBrands().catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    loadSeries(filters.brand_id).catch((err) => setError(err.message))
  }, [filters.brand_id])

  useEffect(() => {
    loadMaterials()
  }, [JSON.stringify(filters)])

  const categories = useMemo(() => {
    return [...new Set(materials.map((material) => material.category).filter(Boolean))]
      .sort()
      .map((category) => ({ value: category, label: category }))
  }, [materials])

  const brandOptions = brands.map((brand) => ({ value: brand.id, label: brand.name }))
  const seriesOptions = series.map((item) => ({ value: item.id, label: item.name }))

  async function openDetails(material) {
    setSelected(material)
    setCompatibles([])
    setCompatLoading(true)
    try {
      const data = await catalogApi.compatibility(material.id)
      setCompatibles(data.compatible_materials || [])
    } catch (err) {
      setCompatibles([])
    } finally {
      setCompatLoading(false)
    }
  }

  function openForm(material = null) {
    setEditing(material)
    setForm(material ? {
      ...emptyMaterial,
      ...material,
      name: material.name || '',
      brand_id: material.brand_id || '',
      series_id: material.series_id || '',
      base_price: Number(material.base_price || 0),
      vat_rate: Number(material.vat_rate ?? 23),
      is_active: material.is_active ?? 1,
    } : emptyMaterial)
    setModal(true)
  }

  async function saveMaterial() {
    try {
      const payload = {
        ...form,
        brand_id: form.brand_id || null,
        series_id: form.series_id || null,
        base_price: Number(form.base_price || 0),
        vat_rate: Number(form.vat_rate || 23),
        is_active: Number(form.is_active ?? 1),
      }
      editing ? await catalogApi.updateMaterial(editing.id, payload) : await catalogApi.createMaterial(payload)
      setModal(false)
      await loadMaterials()
    } catch (err) {
      alert(err.message)
    }
  }

  function clearFilters() {
    setFilters({ brand_id: '', series_id: '', category: '', profession: '', q: '' })
  }

  return (
    <div className="space-y-5">
      {/* @section: catalog-header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Catálogo profissional</h2>
          <p className="text-sm text-gray-500">Marcas, séries, materiais compatíveis e filtros por profissão para preparar orçamentos mais rápido.</p>
        </div>
        <Button onClick={() => openForm()}>Adicionar ao catálogo</Button>
      </div>

      {/* @section: catalog-filters */}
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-5">
          <Select label="Marca" value={filters.brand_id} options={brandOptions} placeholder="Todas" onChange={(e) => setFilters({ ...filters, brand_id: e.target.value, series_id: '' })} />
          <Select label="Série" value={filters.series_id} options={seriesOptions} placeholder={filters.brand_id ? 'Todas' : 'Escolha marca'} onChange={(e) => setFilters({ ...filters, series_id: e.target.value })} />
          <Select label="Profissão" value={filters.profession} options={PROFESSIONS} placeholder="Todas" onChange={(e) => setFilters({ ...filters, profession: e.target.value })} />
          <Select label="Categoria" value={filters.category} options={categories} placeholder="Todas" onChange={(e) => setFilters({ ...filters, category: e.target.value })} />
          <Input label="Pesquisa" value={filters.q} placeholder="Código ou nome" onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
          <span>{materials.length} material{materials.length === 1 ? '' : 'ais'} encontrado{materials.length === 1 ? '' : 's'}</span>
          <Button variant="ghost" onClick={clearFilters}>Limpar filtros</Button>
        </div>
      </section>

      {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {loading && <div className="rounded-2xl border bg-white p-6 text-sm text-gray-500 shadow-sm">A carregar catálogo...</div>}

      {/* @section: catalog-grid */}
      {!loading && materials.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {materials.map((material) => (
            <article key={material.id} className="flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-semibold text-blue-700">{material.code}</p>
                  <h3 className="mt-1 text-lg font-extrabold text-gray-900">{materialName(material)}</h3>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{material.category || 'Sem categoria'}</span>
              </div>
              <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm text-gray-500">{material.description || 'Sem descrição detalhada.'}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-gray-50 p-3"><dt className="text-gray-500">Marca</dt><dd className="font-bold text-gray-900">{material.brand_name || '—'}</dd></div>
                <div className="rounded-xl bg-gray-50 p-3"><dt className="text-gray-500">Série</dt><dd className="font-bold text-gray-900">{material.series_name || '—'}</dd></div>
                <div className="rounded-xl bg-gray-50 p-3"><dt className="text-gray-500">Preço base</dt><dd className="font-bold text-gray-900">{formatMoney(material.base_price)}</dd></div>
                <div className="rounded-xl bg-gray-50 p-3"><dt className="text-gray-500">IVA / un.</dt><dd className="font-bold text-gray-900">{material.vat_rate}% · {material.unit}</dd></div>
              </dl>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => openDetails(material)}>Compatibilidades</Button>
                <Button variant="ghost" onClick={() => openForm(material)}>Editar</Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && !materials.length && <EmptyState title="Sem materiais no catálogo" description="Ajuste os filtros ou adicione materiais ao catálogo profissional." />}

      {/* @section: compatibility-modal */}
      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected ? `Compatibilidades — ${materialName(selected)}` : 'Compatibilidades'} footer={<Button variant="secondary" onClick={() => setSelected(null)}>Fechar</Button>}>
        {selected && <div className="space-y-4">
          <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
            <strong>{selected.code}</strong> · {selected.brand_name || 'Sem marca'} {selected.series_name ? `· ${selected.series_name}` : ''}
          </div>
          {compatLoading && <p className="text-sm text-gray-500">A carregar compatibilidades...</p>}
          {!compatLoading && compatibles.length === 0 && <EmptyState title="Sem compatibilidades registadas" description="Este material ainda não tem materiais compatíveis associados." />}
          {!compatLoading && compatibles.length > 0 && <div className="space-y-2">{compatibles.map((item) => <div key={item.id} className="rounded-xl border p-3 text-sm"><div className="flex justify-between gap-3"><strong>{item.name}</strong><span className="text-blue-700">{item.compatibility_type}</span></div><p className="text-gray-500">{item.code} · {item.category} · {formatMoney(item.base_price)} / {item.unit}</p></div>)}</div>}
        </div>}
      </Modal>

      {/* @section: catalog-form-modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar material do catálogo' : 'Adicionar material ao catálogo'} footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button><Button onClick={saveMaterial}>Guardar</Button></div>}>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Código" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Descrição" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="Categoria" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Input label="Subcategoria" value={form.subcategory || ''} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} />
          <Select label="Marca" value={form.brand_id || ''} options={brandOptions} placeholder="Sem marca" onChange={(e) => setForm({ ...form, brand_id: e.target.value, series_id: '' })} />
          <Select label="Série" value={form.series_id || ''} options={seriesOptions} placeholder="Sem série" onChange={(e) => setForm({ ...form, series_id: e.target.value })} />
          <Input label="Unidade" value={form.unit || 'un'} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          <Input label="Preço base" type="number" step="0.01" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} />
          <Input label="IVA %" type="number" value={form.vat_rate} onChange={(e) => setForm({ ...form, vat_rate: e.target.value })} />
          <Input label="Cor" value={form.color || ''} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          <Input label="Acabamento" value={form.finish || ''} onChange={(e) => setForm({ ...form, finish: e.target.value })} />
        </div>
      </Modal>
    </div>
  )
}
