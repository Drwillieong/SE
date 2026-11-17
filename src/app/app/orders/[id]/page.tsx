import {OrderDetail} from "@/features/customer/order-detail";
export default async function OrderPage({params}:{params:Promise<{id:string}>}){const {id}=await params;return <OrderDetail orderId={id}/>}
