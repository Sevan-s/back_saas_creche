export function requestTime(req, res, next) {
    const date = Date.now();
    const frenchDate = new Date(date).toLocaleString('fr-FR')
    
    console.log(frenchDate)
    next();
}