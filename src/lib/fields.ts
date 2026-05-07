// Field definitions for the order system
export interface OrderField {
  key: string
  label: string
  required: boolean
  type: 'string' | 'number' | 'integer' | 'enum'
  enumValues?: string[]
}

export const ORDER_FIELDS: OrderField[] = [
  { key: 'externalCode', label: '外部编码', required: false, type: 'string' },
  { key: 'senderName', label: '发件人姓名', required: true, type: 'string' },
  { key: 'senderPhone', label: '发件人电话', required: true, type: 'string' },
  { key: 'senderAddress', label: '发件人地址', required: true, type: 'string' },
  { key: 'receiverName', label: '收件人姓名', required: true, type: 'string' },
  { key: 'receiverPhone', label: '收件人电话', required: true, type: 'string' },
  { key: 'receiverAddress', label: '收件人地址', required: true, type: 'string' },
  { key: 'weight', label: '重量(kg)', required: true, type: 'number' },
  { key: 'quantity', label: '件数', required: true, type: 'integer' },
  { key: 'tempZone', label: '温层', required: true, type: 'enum', enumValues: ['常温', '冷藏', '冷冻'] },
  { key: 'remark', label: '备注', required: false, type: 'string' },
]

// Column name aliases for auto-detection
export const COLUMN_ALIASES: Record<string, string[]> = {
  externalCode: ['外部编码', '客户单号', '订单号', '订单编号', '外部订单号', 'Order No', 'External Code', 'order_no', 'ext_code', 'Ref Code', 'RefCode'],
  senderName: ['发件人姓名', '发件人', '寄件人', '发货人', '发方', 'Sender', 'Sender Name', 'sender_name', '寄件人姓名'],
  senderPhone: ['发件人电话', '发件人手机', '寄件人电话', '发货人电话', '发货电话', '发件电话', '发方电话', 'Sender Phone', 'Sender Tel', 'sender_phone', '寄件人手机'],
  senderAddress: ['发件人地址', '发件地址', '寄件地址', '发货地址', '发方地址', 'Sender Address', 'sender_address', '寄件人地址'],
  receiverName: ['收件人姓名', '收件人', '收货人', '收方', 'Receiver', 'Receiver Name', 'receiver_name', '收货人姓名', '收方姓名'],
  receiverPhone: ['收件人电话', '收件人手机', '收货人电话', '收货电话', '收件电话', '收方电话', 'Receiver Phone', 'Receiver Tel', 'receiver_phone', '收货人手机'],
  receiverAddress: ['收件人地址', '收件地址', '收货地址', '收货地址', '收方地址', 'Receiver Address', 'receiver_address', '收货人地址'],
  weight: ['重量', '重量(kg)', '重量（kg）', '重量(KG)', '重量（KG）', '货物重量', 'Weight', 'weight', 'Weight(kg)', 'Weight(KG)'],
  quantity: ['件数', '数量', '包裹数', '包裹数量', 'Qty', 'Quantity', 'quantity', 'Pieces'],
  tempZone: ['温层', '温度层', '温区', '储运温层', '温度要求', 'Temp Zone', 'Temperature', 'temp_zone', 'Temp'],
  remark: ['备注', '附言', '说明', '备注信息', 'Remark', 'Note', 'Notes', 'remark', 'Comment'],
}

// Generate fingerprint from header columns
export function generateFingerprint(headers: string[]): string {
  return headers.filter(h => h.trim()).sort().join('|').toLowerCase()
}

// Auto-detect column mapping
export function autoDetectMapping(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {}
  
  for (const [fieldKey, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]?.trim()
      if (!header) continue
      const normalizedHeader = header.toLowerCase().replace(/[\s\(\)（）]/g, '')
      for (const alias of aliases) {
        const normalizedAlias = alias.toLowerCase().replace(/[\s\(\)（）]/g, '')
        if (normalizedHeader === normalizedAlias || normalizedHeader.includes(normalizedAlias) || normalizedAlias.includes(normalizedHeader)) {
          if (!mapping[fieldKey]) {
            mapping[fieldKey] = i
            break
          }
        }
      }
      if (mapping[fieldKey] !== undefined) break
    }
  }
  
  return mapping
}

// Validate a single order row
export interface ValidationError {
  row: number
  field: string
  fieldLabel: string
  message: string
}

export function validateRow(row: Record<string, unknown>, rowIndex: number): ValidationError[] {
  const errors: ValidationError[] = []
  
  for (const field of ORDER_FIELDS) {
    const value = row[field.key]
    const strValue = value != null ? String(value).trim() : ''
    
    if (field.required && !strValue) {
      errors.push({ row: rowIndex, field: field.key, fieldLabel: field.label, message: '必填字段缺失' })
      continue
    }
    
    if (!strValue) continue
    
    if (field.key === 'senderPhone' || field.key === 'receiverPhone') {
      if (!/^[\d\-+\s()]{7,20}$/.test(strValue)) {
        errors.push({ row: rowIndex, field: field.key, fieldLabel: field.label, message: '电话格式错误' })
      }
    }
    
    if (field.type === 'number') {
      const num = Number(strValue)
      if (isNaN(num) || num <= 0) {
        errors.push({ row: rowIndex, field: field.key, fieldLabel: field.label, message: '必须为正数' })
      }
    }
    
    if (field.type === 'integer') {
      const num = Number(strValue)
      if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
        errors.push({ row: rowIndex, field: field.key, fieldLabel: field.label, message: '必须为正整数' })
      }
    }
    
    if (field.type === 'enum' && field.enumValues) {
      if (!field.enumValues.includes(strValue)) {
        errors.push({ row: rowIndex, field: field.key, fieldLabel: field.label, message: `值必须为: ${field.enumValues.join('/')}` })
      }
    }
  }
  
  return errors
}
