import {
  listTenants,
  getTenantById,
  createTenant as createTenantService,
  updateTenant as updateTenantService,
  deleteTenant as deleteTenantService,
} from "../services/tenantService.js";

export async function getTenants(req, res) {
  try {
    const tenants = await listTenants();
    res.json(tenants);
  } catch (error) {
    console.error("Failed to fetch tenants", error);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Failed to fetch tenants" });
  }
}

export async function getTenant(req, res) {
  try {
    const { id } = req.params;
    const tenant = await getTenantById(id);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }
    res.json(tenant);
  } catch (error) {
    console.error("Failed to fetch tenant", error);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Failed to fetch tenant" });
  }
}

export async function createTenant(req, res) {
  try {
    const tenant = await createTenantService(req.body);
    res.status(201).json(tenant);
  } catch (error) {
    console.error("Failed to create tenant", error);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Không thể tạo người thuê" });
  }
}

export async function updateTenant(req, res) {
  try {
    const { id } = req.params;
    const tenant = await updateTenantService(id, req.body);
    res.json(tenant);
  } catch (error) {
    console.error("Failed to update tenant", error);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Failed to update tenant" });
  }
}

export async function deleteTenant(req, res) {
  try {
    const { id } = req.params;
    const result = await deleteTenantService(id);
    res.json(result);
  } catch (error) {
    console.error("Failed to delete tenant", error);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Failed to delete tenant" });
  }
}
