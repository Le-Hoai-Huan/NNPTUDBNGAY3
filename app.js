const API_URL = "https://api.escuelajs.co/api/v1/products";
const productBody = document.getElementById("productBody");
const searchInput = document.getElementById("searchInput");
const itemsPerPageSelect = document.getElementById("itemsPerPage");
const pagination = document.getElementById("pagination");
const pageInfo = document.getElementById("pageInfo");

let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let itemsPerPage = 10;
let sortField = null;
let sortOrder = 'asc';
let currentProduct = null;
let productModal = null;
let createModal = null;

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

const sortProducts = (field) => {
  if (sortField === field) {
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    sortField = field;
    sortOrder = 'asc';
  }

  filteredProducts.sort((a, b) => {
    let valueA, valueB;
    
    if (field === 'title') {
      valueA = a.title.toLowerCase();
      valueB = b.title.toLowerCase();
    } else if (field === 'price') {
      valueA = a.price;
      valueB = b.price;
    }

    if (sortOrder === 'asc') {
      return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
    } else {
      return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
    }
  });

  currentPage = 1;
  renderProducts();
  updateSortIcons();
};

const updateSortIcons = () => {
  document.querySelectorAll('.sort-icon').forEach(icon => {
    icon.innerHTML = '⇅';
    icon.style.opacity = '0.3';
  });

  if (sortField) {
    const activeIcon = document.getElementById(`sort-${sortField}`);
    if (activeIcon) {
      activeIcon.innerHTML = sortOrder === 'asc' ? '↑' : '↓';
      activeIcon.style.opacity = '1';
    }
  }
};

const renderProducts = () => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const productsToShow = filteredProducts.slice(startIndex, endIndex);

  if (!productsToShow.length) {
    productBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted">Không có dữ liệu phù hợp</td>
      </tr>
    `;
    pageInfo.textContent = "";
    pagination.innerHTML = "";
    return;
  }

  productBody.innerHTML = productsToShow
    .map((product) => {
      const categoryName = product.category?.name ?? "-";
      const firstImage = Array.isArray(product.images) && product.images.length
        ? product.images[0]
        : "";
      const description = product.description || "Không có mô tả";

      return `
        <tr data-bs-toggle="tooltip" data-bs-placement="top" data-bs-html="true" title="${description.replace(/"/g, '&quot;')}" style="cursor: pointer;" onclick="showProductDetail(${product.id})">
          <td>${product.id}</td>
          <td>${product.title}</td>
          <td><span class="badge text-bg-success badge-price">${formatCurrency(product.price)}</span></td>
          <td>${categoryName}</td>
          <td>
            ${firstImage ? `<img src="${firstImage}" alt="${product.title}" class="product-image" />` : "-"}
          </td>
        </tr>
      `;
    })
    .join("");
  
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  [...tooltipTriggerList].map(el => new bootstrap.Tooltip(el));

  const totalItems = filteredProducts.length;
  const showing = `Hien thi ${startIndex + 1}-${Math.min(endIndex, totalItems)} / ${totalItems} san pham`;
  pageInfo.textContent = showing;

  renderPagination();
};

const renderPagination = () => {
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  
  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  let paginationHTML = "";
  
  paginationHTML += `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">Truoc</a>
    </li>
  `;

  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) {
    paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(1); return false;">1</a></li>`;
    if (startPage > 2) paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    paginationHTML += `
      <li class="page-item ${i === currentPage ? 'active' : ''}">
        <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
      </li>
    `;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(${totalPages}); return false;">${totalPages}</a></li>`;
  }

  paginationHTML += `
    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">Sau</a>
    </li>
  `;

  pagination.innerHTML = paginationHTML;
};

window.changePage = (page) => {
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderProducts();
};

window.sortProducts = sortProducts;

const filterProducts = () => {
  const keyword = searchInput.value.trim().toLowerCase();
  filteredProducts = allProducts.filter((p) => p.title.toLowerCase().includes(keyword));
  currentPage = 1;
  
  if (sortField) {
    sortProducts(sortField);
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    renderProducts();
  }
};

const fetchProducts = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Network error");
    const data = await response.json();
    allProducts = Array.isArray(data) ? data : [];
    filteredProducts = allProducts;
    renderProducts();
    updateSortIcons();
  } catch (error) {
    productBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-danger">Khong the tai du lieu</td>
      </tr>
    `;
  }
};

searchInput.addEventListener("input", filterProducts);

itemsPerPageSelect.addEventListener("change", () => {
  itemsPerPage = parseInt(itemsPerPageSelect.value);
  currentPage = 1;
  renderProducts();
});

fetchProducts();

document.addEventListener('DOMContentLoaded', () => {
  productModal = new bootstrap.Modal(document.getElementById('productModal'));
  createModal = new bootstrap.Modal(document.getElementById('createModal'));
});

window.showProductDetail = async (productId) => {
  const productDetail = document.getElementById('productDetail');
  const productForm = document.getElementById('productForm');
  const editBtn = document.getElementById('editBtn');
  const saveBtn = document.getElementById('saveBtn');
  const cancelBtn = document.getElementById('cancelBtn');

  productDetail.style.display = 'block';
  productForm.style.display = 'none';
  editBtn.style.display = 'inline-block';
  saveBtn.style.display = 'none';
  cancelBtn.style.display = 'none';

  productDetail.innerHTML = `
    <div class="text-center">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Dang tai...</span>
      </div>
    </div>
  `;

  if (!productModal) {
    productModal = new bootstrap.Modal(document.getElementById('productModal'));
  }
  productModal.show();

  try {
    const response = await fetch(`${API_URL}/${productId}`);
    if (!response.ok) throw new Error('Khong the tai du lieu');
    
    currentProduct = await response.json();
    
    const categoryName = currentProduct.category?.name ?? "-";
    const images = Array.isArray(currentProduct.images) ? currentProduct.images : [];
    
    productDetail.innerHTML = `
      <div class="row">
        <div class="col-md-5">
          ${images.length > 0 ? `
            <div id="productCarousel" class="carousel slide" data-bs-ride="carousel">
              <div class="carousel-inner">
                ${images.map((img, index) => `
                  <div class="carousel-item ${index === 0 ? 'active' : ''}">
                    <img src="${img}" class="d-block w-100 rounded" alt="${currentProduct.title}" style="max-height: 300px; object-fit: cover;">
                  </div>
                `).join('')}
              </div>
              ${images.length > 1 ? `
                <button class="carousel-control-prev" type="button" data-bs-target="#productCarousel" data-bs-slide="prev">
                  <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                </button>
                <button class="carousel-control-next" type="button" data-bs-target="#productCarousel" data-bs-slide="next">
                  <span class="carousel-control-next-icon" aria-hidden="true"></span>
                </button>
              ` : ''}
            </div>
          ` : '<p class="text-muted">Khong co hinh anh</p>'}
        </div>
        <div class="col-md-7">
          <h4>${currentProduct.title}</h4>
          <p class="text-muted mb-2">ID: ${currentProduct.id}</p>
          <h5 class="text-success mb-3">${formatCurrency(currentProduct.price)}</h5>
          <p><strong>Category:</strong> ${categoryName}</p>
          <p><strong>Description:</strong></p>
          <p>${currentProduct.description || 'Khong co mo ta'}</p>
          <hr>
          <p class="text-muted small">
            <strong>Created:</strong> ${new Date(currentProduct.creationAt).toLocaleString('vi-VN')}<br>
            <strong>Updated:</strong> ${new Date(currentProduct.updatedAt).toLocaleString('vi-VN')}
          </p>
        </div>
      </div>
    `;
  } catch (error) {
    productDetail.innerHTML = `
      <div class="alert alert-danger">
        Khong the tai thong tin san pham. Vui long thu lai.
      </div>
    `;
  }
};

window.enableEdit = () => {
  if (!currentProduct) return;

  const productDetail = document.getElementById('productDetail');
  const productForm = document.getElementById('productForm');
  const editBtn = document.getElementById('editBtn');
  const saveBtn = document.getElementById('saveBtn');
  const cancelBtn = document.getElementById('cancelBtn');

  document.getElementById('editTitle').value = currentProduct.title;
  document.getElementById('editPrice').value = currentProduct.price;
  document.getElementById('editDescription').value = currentProduct.description || '';
  document.getElementById('editCategoryId').value = currentProduct.category?.id || '';
  document.getElementById('editImages').value = Array.isArray(currentProduct.images) 
    ? currentProduct.images.join(', ') 
    : '';

  productDetail.style.display = 'none';
  productForm.style.display = 'block';
  editBtn.style.display = 'none';
  saveBtn.style.display = 'inline-block';
  cancelBtn.style.display = 'inline-block';
};

window.cancelEdit = () => {
  const productDetail = document.getElementById('productDetail');
  const productForm = document.getElementById('productForm');
  const editBtn = document.getElementById('editBtn');
  const saveBtn = document.getElementById('saveBtn');
  const cancelBtn = document.getElementById('cancelBtn');

  productDetail.style.display = 'block';
  productForm.style.display = 'none';
  editBtn.style.display = 'inline-block';
  saveBtn.style.display = 'none';
  cancelBtn.style.display = 'none';
};

window.saveProduct = async () => {
  if (!currentProduct) return;

  const title = document.getElementById('editTitle').value.trim();
  const price = parseFloat(document.getElementById('editPrice').value);
  const description = document.getElementById('editDescription').value.trim();
  const categoryId = parseInt(document.getElementById('editCategoryId').value);
  const imagesInput = document.getElementById('editImages').value.trim();
  const images = imagesInput ? imagesInput.split(',').map(img => img.trim()) : [];

  if (!title || !price || !categoryId) {
    alert('Vui long dien day du thong tin bat buoc!');
    return;
  }

  const saveBtn = document.getElementById('saveBtn');
  const originalText = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.textContent = 'Dang luu...';

  try {
    const response = await fetch(`${API_URL}/${currentProduct.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        price,
        description,
        categoryId,
        images
      })
    });

    if (!response.ok) throw new Error('Khong the cap nhat san pham');

    const updatedProduct = await response.json();
    
    const index = allProducts.findIndex(p => p.id === updatedProduct.id);
    if (index !== -1) {
      allProducts[index] = updatedProduct;
      filterProducts();
    }

    alert('Cap nhat san pham thanh cong!');
    productModal.hide();
  } catch (error) {
    alert('Loi khi cap nhat san pham: ' + error.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  }
};

window.showCreateModal = () => {
  document.getElementById('createForm').reset();
  
  if (!createModal) {
    createModal = new bootstrap.Modal(document.getElementById('createModal'));
  }
  createModal.show();
};

window.createProduct = async () => {
  const title = document.getElementById('createTitle').value.trim();
  const price = parseFloat(document.getElementById('createPrice').value);
  const description = document.getElementById('createDescription').value.trim();
  const categoryId = parseInt(document.getElementById('createCategoryId').value);
  const imagesInput = document.getElementById('createImages').value.trim();
  
  let images = [];
  if (imagesInput) {
    images = imagesInput
      .split(/[,\n]/)
      .map(img => img.trim())
      .filter(img => img.length > 0);
  }

  if (!title || !price || !categoryId) {
    alert('Vui long dien day du thong tin bat buoc (Title, Price, Category ID)!');
    return;
  }

  if (price <= 0) {
    alert('Gia phai lon hon 0!');
    return;
  }

  const createBtn = event.target;
  const originalText = createBtn.innerHTML;
  createBtn.disabled = true;
  createBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Dang tao...';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        price,
        description,
        categoryId,
        images: images.length > 0 ? images : ["https://placeimg.com/640/480/any"]
      })
    });

    if (!response.ok) throw new Error('Khong the tao san pham');

    const newProduct = await response.json();
    
    allProducts.unshift(newProduct);
    filteredProducts = allProducts;
    currentPage = 1;
    renderProducts();

    alert('Tao san pham thanh cong!');
    createModal.hide();
    document.getElementById('createForm').reset();
  } catch (error) {
    alert('Loi khi tao san pham: ' + error.message);
  } finally {
    createBtn.disabled = false;
    createBtn.innerHTML = originalText;
  }
};

window.exportToCSV = () => {
  if (!filteredProducts || filteredProducts.length === 0) {
    alert('Khong co du lieu de export!');
    return;
  }

  const headers = ['ID', 'Title', 'Price', 'Category', 'Images'];
  const csvRows = [];
  
  csvRows.push(headers.join(','));
  
  filteredProducts.forEach(product => {
    const row = [
      product.id,
      `"${(product.title || '').replace(/"/g, '""')}"`,
      product.price,
      `"${(product.category?.name || '-').replace(/"/g, '""')}"`,
      `"${Array.isArray(product.images) ? product.images.join('; ') : ''}"`
    ];
    csvRows.push(row.join(','));
  });
  
  const csvContent = csvRows.join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  link.setAttribute('href', url);
  link.setAttribute('download', `products_export_${timestamp}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  alert(`Da export ${filteredProducts.length} san pham ra file CSV!`);
};
