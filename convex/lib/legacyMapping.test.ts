import {describe,expect,it} from "vitest";
import {mapLegacyPickupSlot,mapLegacyServiceType,mapLegacyStatus,pesosToCentavos} from "./legacyMapping";
describe("legacy migration mapping",()=>{
  it("maps statuses with the legacy pending/kilos rule",()=>{expect(mapLegacyStatus("pending_booking",null)).toBe("requested");expect(mapLegacyStatus("pending",4)).toBe("received");expect(mapLegacyStatus("pending",null)).toBe("approved");expect(mapLegacyStatus("washing",2)).toBe("washing");});
  it("maps known services and pickup windows",()=>{expect(mapLegacyServiceType("washDryFold")).toBe("washDryFold");expect(mapLegacyServiceType("washFold")).toBe("washFold");expect(mapLegacyPickupSlot("7am-10am")).toBe("am");expect(mapLegacyPickupSlot("5pm-7pm")).toBe("pm");});
  it("converts pesos to integer centavos",()=>{expect(pesosToCentavos("129.95")).toBe(12995);expect(pesosToCentavos(10)).toBe(1000);});
});
