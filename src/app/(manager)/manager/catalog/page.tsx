"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil, RefreshCw, DollarSign, Clock } from "lucide-react";
import { ManagerHeader } from "@/components/innara/ManagerHeader";
import { PageContainer } from "@/components/innara/PageContainer";
import { PageHeader } from "@/components/innara/PageHeader";
import { EmptyState } from "@/components/innara/EmptyState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getMenuCategories, getMenuItems } from "@/app/actions/menu";
import {
  getServiceOptions,
  updateServiceOption,
  createServiceOption,
  type ServiceOption,
} from "@/app/actions/branding";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_LABELS } from "@/constants/app";

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

interface MenuCategory {
  id: string;
  name: string;
  sort_order: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  category_id: string;
}

interface ServiceFormData {
  serviceType: string;
  name: string;
  description: string;
  price: string;
  etaMinutes: string;
  isActive: boolean;
}

const DEFAULT_FORM: ServiceFormData = {
  serviceType: "",
  name: "",
  description: "",
  price: "",
  etaMinutes: "",
  isActive: true,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(value: number | null): string {
  if (value === null) return "—";
  return `$${value.toFixed(2)}`;
}

function formatEta(minutes: number | null): string {
  if (minutes === null) return "—";
  return `${minutes}m`;
}

// ---------------------------------------------------------------------------
// Skeleton loaders
// ---------------------------------------------------------------------------

function MenuSkeletonGrid(): React.ReactElement {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass-card-dark rounded-2xl p-5">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-2/3 mb-4" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ServiceSkeletonList(): React.ReactElement {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-card-dark rounded-2xl px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-5 w-48 mb-1" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MenuTab
// ---------------------------------------------------------------------------

function MenuTab(): React.ReactElement {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    const result = await getMenuCategories();
    if (!result.success || !result.data) {
      setCategoriesError(result.error ?? "Failed to load categories.");
      setCategoriesLoading(false);
      return;
    }
    const cats = result.data as MenuCategory[];
    setCategories(cats);
    setCategoriesLoading(false);
    if (cats.length > 0 && selectedCategoryId === null) {
      setSelectedCategoryId(cats[0].id);
    }
  }, [selectedCategoryId]);

  const loadItems = useCallback(async (categoryId: string) => {
    setItemsLoading(true);
    setItemsError(null);
    const result = await getMenuItems(categoryId);
    if (!result.success || !result.data) {
      setItemsError(result.error ?? "Failed to load menu items.");
      setItemsLoading(false);
      return;
    }
    setItems(result.data as MenuItem[]);
    setItemsLoading(false);
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (selectedCategoryId) {
      void loadItems(selectedCategoryId);
    }
  }, [selectedCategoryId, loadItems]);

  // ---- Error state for categories ----
  if (categoriesError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="glass-card-dark p-8 rounded-2xl text-center max-w-md">
          <p className="text-base font-medium mb-2">Unable to load categories</p>
          <p className="text-sm text-muted-foreground mb-6">{categoriesError}</p>
          <Button
            variant="outline"
            onClick={() => void loadCategories()}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Category filter chips */}
      <div className="flex items-center gap-2 flex-wrap mb-6" role="group" aria-label="Filter by category">
        {categoriesLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))
          : categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                aria-pressed={selectedCategoryId === cat.id}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B7340] ${
                  selectedCategoryId === cat.id
                    ? "bg-[#9B7340] text-white"
                    : "bg-white/10 text-muted-foreground hover:bg-white/15 hover:text-foreground"
                }`}
              >
                {cat.name}
              </button>
            ))}
      </div>

      {/* Items grid */}
      {itemsLoading ? (
        <MenuSkeletonGrid />
      ) : itemsError ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="glass-card-dark p-6 rounded-2xl text-center max-w-md">
            <p className="text-sm text-muted-foreground mb-4">{itemsError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedCategoryId && void loadItems(selectedCategoryId)}
              className="gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </Button>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card-dark rounded-2xl">
          <EmptyState
            iconName="cart"
            title="No items in this category"
            description="There are no menu items in this category yet."
            size="md"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MenuItemCard
// ---------------------------------------------------------------------------

interface MenuItemCardProps {
  item: MenuItem;
}

function MenuItemCard({ item }: MenuItemCardProps): React.ReactElement {
  return (
    <article className="glass-card-dark rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex-1">
        <h3 className="text-sm font-semibold leading-snug mb-1 line-clamp-1">
          {item.name}
        </h3>
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#9B7340]">
          {formatPrice(item.price)}
        </span>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            item.is_available
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-white/10 text-muted-foreground"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              item.is_available ? "bg-emerald-400" : "bg-muted-foreground"
            }`}
            aria-hidden="true"
          />
          {item.is_available ? "Available" : "Unavailable"}
        </span>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// ServicesTab
// ---------------------------------------------------------------------------

function ServicesTab(): React.ReactElement {
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingService, setEditingService] = useState<ServiceOption | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getServiceOptions();
    if (!result.success || !result.data) {
      setError(result.error ?? "Failed to load service options.");
      setLoading(false);
      return;
    }
    setServices(result.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  const handleAddService = () => {
    setEditingService(null);
    setFormData(DEFAULT_FORM);
    setShowDialog(true);
  };

  const handleEditService = (svc: ServiceOption) => {
    setEditingService(svc);
    setFormData({
      serviceType: svc.serviceType,
      name: svc.name,
      description: svc.description ?? "",
      price: svc.price !== null ? String(svc.price) : "",
      etaMinutes: svc.etaMinutes !== null ? String(svc.etaMinutes) : "",
      isActive: svc.isActive,
    });
    setShowDialog(true);
  };

  const handleToggleActive = async (svc: ServiceOption) => {
    setTogglingId(svc.id);
    const result = await updateServiceOption(svc.id, { isActive: !svc.isActive });
    if (result.success && result.data) {
      setServices((prev) =>
        prev.map((s) => (s.id === svc.id ? result.data! : s)),
      );
      toast.success(`${svc.name} ${!svc.isActive ? "activated" : "deactivated"}.`);
    } else {
      toast.error(result.error ?? "Failed to update service.");
    }
    setTogglingId(null);
  };

  const handleSubmitService = async () => {
    if (!formData.serviceType.trim()) {
      toast.error("Service type is required.");
      return;
    }
    if (!formData.name.trim()) {
      toast.error("Name is required.");
      return;
    }

    setSubmitting(true);

    const payload = {
      serviceType: formData.serviceType.trim(),
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      price: formData.price !== "" ? Number(formData.price) : null,
      etaMinutes: formData.etaMinutes !== "" ? Number(formData.etaMinutes) : null,
      isActive: formData.isActive,
    };

    if (editingService) {
      const result = await updateServiceOption(editingService.id, payload);
      if (result.success && result.data) {
        setServices((prev) =>
          prev.map((s) => (s.id === editingService.id ? result.data! : s)),
        );
        toast.success("Service option updated.");
        setShowDialog(false);
      } else {
        toast.error(result.error ?? "Failed to update service option.");
      }
    } else {
      const result = await createServiceOption(payload);
      if (result.success && result.data) {
        setServices((prev) => [...prev, result.data!]);
        toast.success("Service option created.");
        setShowDialog(false);
      } else {
        toast.error(result.error ?? "Failed to create service option.");
      }
    }

    setSubmitting(false);
  };

  // ---- Error state ----
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="glass-card-dark p-8 rounded-2xl text-center max-w-md">
          <p className="text-base font-medium mb-2">Unable to load services</p>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <Button
            variant="outline"
            onClick={() => void loadServices()}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header row with Add button */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading…" : `${services.length} service${services.length !== 1 ? "s" : ""}`}
        </p>
        <Button
          onClick={handleAddService}
          size="sm"
          className="gap-2 bg-[#9B7340] hover:bg-[#b8924f] text-white border-0"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <ServiceSkeletonList />
      ) : services.length === 0 ? (
        <div className="glass-card-dark rounded-2xl">
          <EmptyState
            iconName="inbox"
            title="No service options yet"
            description="Add your first service option to let guests request it."
            action={{
              label: "Add Service",
              onClick: handleAddService,
            }}
            size="md"
          />
        </div>
      ) : (
        <ul role="list" className="flex flex-col gap-3">
          {services.map((svc) => (
            <ServiceRow
              key={svc.id}
              service={svc}
              toggling={togglingId === svc.id}
              onEdit={handleEditService}
              onToggle={handleToggleActive}
            />
          ))}
        </ul>
      )}

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Edit Service Option" : "Add Service Option"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Service Type */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="serviceType">
                Service Type <span className="text-destructive" aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </Label>
              <Select
                value={formData.serviceType}
                onValueChange={(val: string | null) => {
                  if (val) setFormData((prev) => ({ ...prev, serviceType: val }));
                }}
              >
                <SelectTrigger id="serviceType" className="w-full">
                  <SelectValue placeholder="Select type…" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="serviceName">
                Name <span className="text-destructive" aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </Label>
              <Input
                id="serviceName"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Extra Towels"
                autoComplete="off"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="serviceDescription">Description</Label>
              <Textarea
                id="serviceDescription"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Optional — brief description shown to guests"
                rows={3}
              />
            </div>

            {/* Price + ETA row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="servicePrice">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    Price
                  </span>
                </Label>
                <Input
                  id="servicePrice"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, price: e.target.value }))
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="serviceEta">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    ETA (minutes)
                  </span>
                </Label>
                <Input
                  id="serviceEta"
                  type="number"
                  min={1}
                  step={1}
                  value={formData.etaMinutes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, etaMinutes: e.target.value }))
                  }
                  placeholder="15"
                />
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between py-1">
              <Label htmlFor="serviceActive" className="cursor-pointer select-none">
                Active
              </Label>
              <Switch
                id="serviceActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleSubmitService()}
              disabled={submitting}
              className="bg-[#9B7340] hover:bg-[#b8924f] text-white border-0 gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingService ? "Save Changes" : "Create Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// ServiceRow
// ---------------------------------------------------------------------------

interface ServiceRowProps {
  service: ServiceOption;
  toggling: boolean;
  onEdit: (svc: ServiceOption) => void;
  onToggle: (svc: ServiceOption) => void;
}

function ServiceRow({
  service,
  toggling,
  onEdit,
  onToggle,
}: ServiceRowProps): React.ReactElement {
  const categoryLabel =
    CATEGORY_LABELS[service.serviceType as keyof typeof CATEGORY_LABELS] ??
    service.serviceType;

  return (
    <li className="glass-card-dark rounded-2xl px-5 py-4">
      <div className="flex items-start gap-4">
        {/* Main info — clickable to edit */}
        <button
          className="flex-1 text-left min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B7340] rounded-lg"
          onClick={() => onEdit(service)}
          aria-label={`Edit ${service.name}`}
        >
          <span className="text-xs font-medium text-[#9B7340] uppercase tracking-wide block mb-0.5">
            {categoryLabel}
          </span>
          <span className="text-sm font-semibold block truncate">{service.name}</span>
          {service.description && (
            <span className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {service.description}
            </span>
          )}
        </button>

        {/* Meta + controls */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Price */}
          <span className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
            <DollarSign className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="sr-only">Price:</span>
            {service.price !== null ? service.price.toFixed(2) : "—"}
          </span>

          {/* ETA */}
          <span className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="sr-only">ETA:</span>
            {formatEta(service.etaMinutes)}
          </span>

          {/* Edit button */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(service)}
            aria-label={`Edit ${service.name}`}
            className="text-muted-foreground hover:text-foreground"
          >
            <Pencil className="w-4 h-4" />
          </Button>

          {/* Active toggle */}
          {toggling ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <Switch
              checked={service.isActive}
              onCheckedChange={() => void onToggle(service)}
              aria-label={`${service.isActive ? "Deactivate" : "Activate"} ${service.name}`}
            />
          )}
        </div>
      </div>

      {/* Mobile price + ETA row */}
      <div className="flex items-center gap-4 mt-2 sm:hidden">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <DollarSign className="w-3 h-3" aria-hidden="true" />
          {service.price !== null ? service.price.toFixed(2) : "—"}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" aria-hidden="true" />
          {formatEta(service.etaMinutes)}
        </span>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// ManagerCatalogPage
// ---------------------------------------------------------------------------

export default function ManagerCatalogPage(): React.ReactElement {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/staff/login");
  };

  return (
    <>
      <ManagerHeader onSignOut={() => void handleSignOut()} />
      <PageContainer>
        <PageHeader
          title="Catalog"
          subtitle="Manage menu items and service options"
        />

        <Tabs defaultValue="menu">
          <TabsList className="mb-6">
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>

          <TabsContent value="menu">
            <MenuTab />
          </TabsContent>

          <TabsContent value="services">
            <ServicesTab />
          </TabsContent>
        </Tabs>
      </PageContainer>
    </>
  );
}
