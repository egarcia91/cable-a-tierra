// YYYY-MM-DD → DD/MM/YYYY
export const formatDate = (iso: string) => iso.split("-").reverse().join("/");
