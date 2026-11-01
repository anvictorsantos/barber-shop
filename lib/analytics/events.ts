export enum AnalyticsEventName {
  SignUp = 'sign_up',
  Login = 'login',
  ViewItem = 'view_item',
  AddToCart = 'add_to_cart',
  RemoveFromCart = 'remove_from_cart',
  BeginCheckout = 'begin_checkout',
  Purchase = 'purchase',
  BookingConfirmed = 'booking_confirmed',
  CancelBooking = 'cancel_booking',
  RescheduleBooking = 'reschedule_booking',
  ReviewSubmitted = 'review_submitted',
  LoyaltyCreditEarned = 'loyalty_credit_earned',
  LoyaltyCreditUsed = 'loyalty_credit_used',
}

export type AnalyticsParamValue = string | number | boolean
export type AnalyticsParams = Record<string, AnalyticsParamValue>
