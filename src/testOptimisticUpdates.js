import { optimisticUpdates } from './lib/queryClient';

console.log('optimisticUpdates imported successfully:', !!optimisticUpdates);
console.log('updateProductStock function exists:', !!optimisticUpdates.updateProductStock);
console.log('updateMultipleProductsStock function exists:', !!optimisticUpdates.updateMultipleProductsStock);

export default optimisticUpdates;