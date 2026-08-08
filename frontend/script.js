// ===== Supabase Client Initialization =====

const supabaseUrl = 'https://dntjgvacurwpcyavwdkc.supabase.co';
const supabaseKey = 'sb_publishable_-_6VQDTsincVrv5FwvCZow_g1F7dFHA';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// DOMContentLoaded par loadProducts() call karo
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
});

// ===== Toast Notifications =====

// showToast(): success/error message top-right me dikhata hai
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // 3 second baad auto-remove
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// loadProducts(): Supabase se products fetch karta hai
async function loadProducts() {
  const tbody = document.getElementById('productBody');

  // Loading state dikhao
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#888;">Loading...</td></tr>';

  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*');

    if (error) throw error;

    renderProducts(products);
  } catch (error) {
    console.error('Products load karne me error:', error);
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#e74c3c;">Products load karne me error aaya. Server check karein.</td></tr>';
    showToast('Error: Server se connect nahi ho paya', 'error');
  }
}

// renderProducts(): products ko table rows me render karta hai
function renderProducts(products) {
  const tbody = document.getElementById('productBody');

  // Agar products khali hain to message dikhao
  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#888;">Koi product nahi hai</td></tr>';
    return;
  }

  // Har product ki ek table row banayein
  const rows = products.map(product => `
    <tr>
      <td>${product.id}</td>
      <td>${product.name}</td>
      <td>Rs. ${product.price}</td>
      <td>${product.stock}</td>
      <td>${product.category}</td>
      <td>
        <button class="btn-edit" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}" data-stock="${product.stock}" data-category="${product.category}">Edit</button>
        <button class="btn-delete" data-id="${product.id}">Delete</button>
      </td>
    </tr>
  `).join('');

  tbody.innerHTML = rows;
}

// ===== Modal Open/Close Logic =====

// Add button modal kholta hai
document.getElementById('addProductBtn').addEventListener('click', () => {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Add Product';
  document.getElementById('productForm').reset();
  document.getElementById('productModal').classList.remove('hidden');
});

// Cancel button modal band karta hai
document.getElementById('cancelBtn').addEventListener('click', () => {
  document.getElementById('productModal').classList.add('hidden');
});

// Modal overlay par click karne se band ho jaye
document.getElementById('productModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('productModal')) {
    document.getElementById('productModal').classList.add('hidden');
  }
});

// ===== Form Submit (Add/Edit) =====

// editingId se track karte hain ki edit mode me hain ya add mode me
let editingId = null;

document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('productName').value.trim();
  const price = parseFloat(document.getElementById('productPrice').value);
  const stock = parseInt(document.getElementById('productStock').value);
  const category = document.getElementById('productCategory').value.trim();

  // Form validation: empty fields ya negative price par submit mat hone do
  if (!name || !category) {
    showToast('Error: Name aur Category zaroori hain!', 'error');
    return;
  }

  if (isNaN(price) || price < 0) {
    showToast('Error: Price negative nahi ho sakta!', 'error');
    return;
  }

  if (isNaN(stock) || stock < 0) {
    showToast('Error: Stock negative nahi ho sakta!', 'error');
    return;
  }

  const productData = { name, price, stock, category };

  try {
    if (editingId !== null) {
      // Edit mode: Supabase update karo
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingId);

      if (error) {
        showToast(`Error: ${error.message || 'Update me error aaya'}`, 'error');
        return;
      }
    } else {
      // Add mode: Supabase insert karo
      const { error } = await supabase
        .from('products')
        .insert([productData]);

      if (error) {
        showToast(`Error: ${error.message || 'Add karne me error aaya'}`, 'error');
        return;
      }
    }

    // Success par: modal band, loadProducts() call
    document.getElementById('productModal').classList.add('hidden');
    document.getElementById('productForm').reset();
    editingId = null;
    loadProducts();
    showToast('Product saved ho gaya!', 'success');
  } catch (error) {
    console.error('Error:', error);
    showToast('Error: Server se connect nahi ho paya', 'error');
  }
});

// ===== Edit & Delete Button Events =====

// Event delegation: table ke andar Edit/Delete buttons ke clicks handle karo
document.getElementById('productBody').addEventListener('click', (e) => {
  // Edit button par click
  if (e.target.classList.contains('btn-edit')) {
    const id = e.target.dataset.id;
    const name = e.target.dataset.name;
    const price = e.target.dataset.price;
    const stock = e.target.dataset.stock;
    const category = e.target.dataset.category;

    // editingId set karo (edit mode)
    editingId = parseInt(id);

    // Modal title change karo
    document.getElementById('modalTitle').textContent = 'Edit Product';

    // Form me current values bharo
    document.getElementById('productName').value = name;
    document.getElementById('productPrice').value = price;
    document.getElementById('productStock').value = stock;
    document.getElementById('productCategory').value = category;

    // Modal kholo
    document.getElementById('productModal').classList.remove('hidden');
  }

  // Delete button par click
  if (e.target.classList.contains('btn-delete')) {
    const id = e.target.dataset.id;

    // confirm() dialog
    if (confirm('Kya aap yeh product delete karna chahte hain?')) {
      deleteProduct(id);
    }
  }
});

// deleteProduct(): Supabase se product delete karta hai
async function deleteProduct(id) {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      showToast(`Error: ${error.message || 'Delete me error aaya'}`, 'error');
      return;
    }

    // Delete ke baad loadProducts() call karo
    loadProducts();
    showToast('Product delete ho gaya!', 'success');
  } catch (error) {
    console.error('Error:', error);
    showToast('Error: Server se connect nahi ho paya', 'error');
  }
}
