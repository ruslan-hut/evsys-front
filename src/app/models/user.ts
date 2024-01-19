import {PaymentPlan} from "./payment-plan";
import {UserTag} from "./user-tag";
import {PaymentMethod} from "./payment-method";

export interface User {
  id?: string,
  username: string,
  password: string,
  access_level?: number,
  email?: string,
  name?: string,
  role?: string,
  token?: string,
  payment_plan?: string,
  date_registered?: string,
  last_seen?: string,
  payment_plans?: PaymentPlan[],
  payment_methods?: PaymentMethod[],
  user_tags?: UserTag[],
}
