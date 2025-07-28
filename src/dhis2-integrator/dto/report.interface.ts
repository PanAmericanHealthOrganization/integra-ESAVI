export interface IHeader {
    name: string;
    column: string;
    valueType: string;
    type: string;
    hidden: boolean;
    meta: boolean;
    optionSet?: string; // Este campo es opcional ya que no todos los headers lo tienen
}

export interface IData {
    headers: IHeader[];
    rows: (string | null)[][]; // Asumiendo que cada valor de row puede ser string o null
}