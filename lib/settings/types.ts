export interface ShopSettings {
  id: string
  name: string
  cnpj: string | null
  addressLine: string
  city: string
  state: string
  postalCode: string | null
  phone: string | null
  whatsapp: string
  email: string | null
}

export interface AdminShopHours {
  id: string
  weekday: number
  openMinute: number
  closeMinute: number
  closed: boolean
}

export interface AdminBarber {
  id: string
  displayName: string
  title: string
  avatarUrl: string | null
  active: boolean
  sortOrder: number
  user: {
    name: string
    email: string | null
    phone: string | null
  }
}

export interface AdminGalleryImage {
  url: string
  alt: string
}

export interface AdminTimeBlock {
  id: string
  barberId: string
  label: string
  recurring: boolean
  weekday: number | null
  date: string | null
  startMinute: number
  endMinute: number
  active: boolean
  barber: {
    displayName: string
  }
}
