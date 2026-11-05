import requests
import io
from PIL import Image

BASE_URL = "http://localhost:8080/api"

# 1. Login
login_payload = {
    "email": "raja.reddy@shopivo.demo",
    "password": "Seller@Shopivo2026!"
}
res = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
print("Login status:", res.status_code)
if res.status_code != 200:
    print("Login failed:", res.text)
    exit(1)

token = res.json()["data"]["accessToken"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Get Seller Products
res = requests.get(f"{BASE_URL}/seller/products", headers=headers)
print("Seller products status:", res.status_code)
product_response = res.json()
product_list = product_response.get("data", [])
if not product_list:
    print("No products found for seller")
    exit(1)

if not product_list:
    print("No products found for seller")
    exit(1)

test_product = product_list[0]
prod_id = test_product["id"]
print(f"Testing with Product ID {prod_id}: {test_product.get('name')}")
print(f"Initial image URL: {test_product.get('imageUrl')}")

# 3. Create a valid test JPEG image using PIL
img = Image.new("RGB", (300, 300), color=(73, 109, 137))
img_bytes = io.BytesIO()
img.save(img_bytes, format="JPEG")
img_bytes.seek(0)

# 4. Upload to POST /api/seller/products/{id}/image
files = {"image": ("test_upload.jpg", img_bytes.getvalue(), "image/jpeg")}
upload_res = requests.post(f"{BASE_URL}/seller/products/{prod_id}/image", headers=headers, files=files)
print("Upload status:", upload_res.status_code)
print("Upload response body:", upload_res.text)

if upload_res.status_code != 200:
    print("Upload failed!")
    exit(1)

uploaded_data = upload_res.json()
returned_url = uploaded_data["data"]["imageUrl"]
print("Returned image URL:", returned_url)

# 5. Retrieve via http://localhost:8080/api...
direct_api_url = f"http://localhost:8080/api{returned_url}"
print("\nFetching direct API URL:", direct_api_url)
get_api_res = requests.get(direct_api_url)
print("Direct API status:", get_api_res.status_code)
print("Content-Type:", get_api_res.headers.get("Content-Type"))
print("Content-Length:", len(get_api_res.content))

# 6. Retrieve via Vite Proxy http://localhost:5173...
vite_proxy_url = f"http://localhost:5173{returned_url}"
print("\nFetching Vite proxy URL:", vite_proxy_url)
try:
    get_vite_res = requests.get(vite_proxy_url)
    print("Vite proxy status:", get_vite_res.status_code)
    print("Content-Type:", get_vite_res.headers.get("Content-Type"))
    print("Content-Length:", len(get_vite_res.content))
except Exception as e:
    print("Vite proxy error:", e)
