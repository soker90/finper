import {
  IPension,
  PensionModel
} from '@soker90/finper-models'

export interface IPensionService {
    getPensions(user: string): Promise<IPension[]>

    // editPension({ date, value, companyAmount, employeeAmount, employeeUnits, companyUnits }: IPension): Promise<IPension>
}

export default class PensionService implements IPensionService {
  public async getPensions (user: string): Promise<IPension[]> {
    return PensionModel.find({ user }).sort({ date: -1 })
  }
}
