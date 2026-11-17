import {describe,expect,it} from "vitest";
import {computeQuote} from "./pricing";
import {allowedTransitions,canTransition,nextStage,type OrderStatus} from "./statusMachine";
import {addDays,isPastDate,todayManila} from "./dates";

describe("status machine",()=>{
  it("allows all declared transitions and rejects undeclared transitions",()=>{
    for(const from of Object.keys(allowedTransitions) as OrderStatus[]){
      for(const to of Object.keys(allowedTransitions) as OrderStatus[]){
        const expected=allowedTransitions[from].includes(to)&&!(from==="ready"&&to==="completed");
        expect(canTransition(from,to,"pickupAndDelivery")).toBe(expected);
      }
    }
    expect(canTransition("ready","completed","pickupOnly")).toBe(true);
    expect(canTransition("ready","out_for_delivery","pickupAndDelivery")).toBe(true);
    expect(canTransition("ready","completed","pickupAndDelivery")).toBe(false);
  });
  it("chooses the next processing stage",()=>{
    expect(nextStage("received","pickupOnly")).toBe("washing");
    expect(nextStage("ready","pickupOnly")).toBe("completed");
    expect(nextStage("ready","pickupAndDelivery")).toBe("out_for_delivery");
  });
});

describe("computeQuote",()=>{
  const full={_id:"full",name:"Full Service",pricingType:"per_load" as const,price:19900};
  const wash={_id:"wash",name:"Wash Dry Fold",pricingType:"per_load" as const,price:17900};
  const addon={_id:"addon",name:"Extra Dry",pricingType:"flat" as const,price:2500};
  const quote={_id:"quote",name:"Dry Clean Gown",pricingType:"quote" as const,price:0,startingPrice:65000};
  it("prices both main services at every load count",()=>{
    for(let loads=1;loads<=5;loads++){
      expect(computeQuote({services:[full],selections:[{serviceId:"full",quantity:1}],loads,serviceOption:"pickupOnly",zone:null}).total).toBe(loads*19900);
      expect(computeQuote({services:[wash],selections:[{serviceId:"wash",quantity:1}],loads,serviceOption:"pickupOnly",zone:null}).total).toBe(loads*17900);
    }
  });
  it("prices add-ons, quotes and delivery",()=>{
    const zone={isFreeZone:true,freeMinLoads:2,fee:3000};
    const one=computeQuote({services:[full,addon,quote],selections:[{serviceId:"full",quantity:1},{serviceId:"addon",quantity:2},{serviceId:"quote",quantity:1}],loads:1,serviceOption:"pickupAndDelivery",zone});
    expect(one.subtotal).toBe(24900);expect(one.deliveryFee).toBe(3000);expect(one.hasPendingQuote).toBe(true);expect(one.lines[2].startingPrice).toBe(65000);
    expect(computeQuote({services:[wash],selections:[{serviceId:"wash",quantity:1}],loads:2,serviceOption:"pickupAndDelivery",zone}).deliveryFee).toBe(0);
    expect(computeQuote({services:[wash],selections:[{serviceId:"wash",quantity:1}],loads:1,serviceOption:"pickupOnly",zone}).deliveryFee).toBe(0);
    expect(computeQuote({services:[wash],selections:[{serviceId:"wash",quantity:1}],loads:2,serviceOption:"pickupAndDelivery",zone:{isFreeZone:false,freeMinLoads:2,fee:3000}}).deliveryFee).toBe(3000);
  });
  it("matches the booking examples and leaves per-kilo amounts pending",()=>{
    const freeZone={isFreeZone:true,freeMinLoads:2,fee:3000};
    expect(computeQuote({services:[full],selections:[{serviceId:"full",quantity:1}],loads:1,serviceOption:"pickupAndDelivery",zone:{...freeZone,isFreeZone:false}}).total).toBe(22900);
    expect(computeQuote({services:[wash],selections:[{serviceId:"wash",quantity:1}],loads:2,serviceOption:"pickupAndDelivery",zone:freeZone}).total).toBe(35800);
    const kilo={_id:"kilo",name:"By kilo",pricingType:"per_kilo" as const,price:5000};
    const pending=computeQuote({services:[kilo],selections:[{serviceId:"kilo",quantity:1}],loads:1,serviceOption:"pickupOnly",zone:null});
    expect(pending.total).toBe(0);expect(pending.hasPendingQuote).toBe(true);
  });
});

describe("Manila date helpers",()=>{
  it("formats dates in Asia/Manila and handles date comparisons",()=>{
    expect(todayManila(new Date("2026-11-16T17:00:00Z"))).toBe("2026-11-17");
    expect(addDays("2024-02-28",1)).toBe("2024-02-29");
    expect(isPastDate("2026-11-16","2026-11-17")).toBe(true);
  });
});
