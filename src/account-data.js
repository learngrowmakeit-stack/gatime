// Only this account's data is removed. Guest recipes and other accounts survive.
export function clearAccountData(storage,userId){
 for(const prefix of ['gatime.account.v1:','gatime.shopping.v1:','gatime.meal-plan.v1:','gatime.translated.v1:'])storage.removeItem(`${prefix}${userId}`);
}
