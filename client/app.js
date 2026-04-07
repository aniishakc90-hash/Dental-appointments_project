const API_BASE = "http://localhost:3000/appointments";

let allAppointments = [];
let deleteId = null;

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  if (page === "appointments") {
    initAppointmentsPage();
  }

  if (page === "add") {
    initAddPage();
  }

  if (page === "edit") {
    initEditPage();
  }

  if (page === "admin") {
    initAdminPage();
  }
});

function normalizeAppointment(item) {
  return {
    id: item.id,
    first_name: item.first_name || "",
    last_name: item.last_name || "",
    name: `${item.first_name || ""} ${item.last_name || ""}`.trim(),
    date: item.date || "",
    time: item.time || "",
    treatment: item.treatment || "",
  };
}

async function fetchAppointments() {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error("Failed to fetch appointments");
  const data = await res.json();
  return data.map(normalizeAppointment);
}

function showToast(message, redirectUrl = null) {
  const toast = document.getElementById("toastMessage");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  }, 2200);
}

function createAppointmentRow(item) {
  return `
    <tr>
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.date)}</td>
      <td>${escapeHtml(item.time)}</td>
      <td>${escapeHtml(item.treatment)}</td>
      <td>
        <div class="action-btns">
          <button class="btn btn-sm-edit" onclick="goToEdit(${item.id})">Edit</button>
          <button class="btn btn-sm-delete" onclick="openDeleteModal(${item.id})">Delete</button>
        </div>
      </td>
    </tr>
  `;
}

function renderAppointmentsTable(data) {
  const tbody = document.getElementById("appointmentsTableBody");
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-cell">No appointments found.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = data.map(createAppointmentRow).join("");
}

function applyFilters() {
  const filterName = document.getElementById("filterName")?.value.toLowerCase() || "";
  const filterDate = document.getElementById("filterDate")?.value.toLowerCase() || "";
  const filterTime = document.getElementById("filterTime")?.value.toLowerCase() || "";
  const filterTreatment = document.getElementById("filterTreatment")?.value.toLowerCase() || "";

  const filtered = allAppointments.filter((item) => {
    return (
      item.name.toLowerCase().includes(filterName) &&
      item.date.toLowerCase().includes(filterDate) &&
      item.time.toLowerCase().includes(filterTime) &&
      item.treatment.toLowerCase().includes(filterTreatment)
    );
  });

  renderAppointmentsTable(filtered);
}

async function initAppointmentsPage() {
  try {
    allAppointments = await fetchAppointments();
    renderAppointmentsTable(allAppointments);

    ["filterName", "filterDate", "filterTime", "filterTreatment"].forEach((id) => {
      const input = document.getElementById(id);
      if (input) input.addEventListener("input", applyFilters);
    });

    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

    if (cancelDeleteBtn) {
      cancelDeleteBtn.addEventListener("click", closeDeleteModal);
    }

    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener("click", deleteAppointment);
    }
  } catch (error) {
    renderAppointmentsTable([]);
  }
}

function openDeleteModal(id) {
  deleteId = id;
  const modal = document.getElementById("deleteModal");
  if (modal) modal.classList.remove("hidden");
}

function closeDeleteModal() {
  deleteId = null;
  const modal = document.getElementById("deleteModal");
  if (modal) modal.classList.add("hidden");
}

async function deleteAppointment() {
  if (!deleteId) return;

  try {
    const res = await fetch(`${API_BASE}/${deleteId}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Delete failed");

    closeDeleteModal();
    showToast("Appointment deleted successfully!");

    allAppointments = allAppointments.filter((item) => item.id !== deleteId);
    renderAppointmentsTable(allAppointments);
  } catch (error) {
    closeDeleteModal();
    alert("Unable to delete appointment.");
  }
}

function goToEdit(id) {
  localStorage.setItem("editAppointmentId", id);
  window.location.href = "edit.html";
}

function initAddPage() {
  const form = document.getElementById("addAppointmentForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      first_name: document.getElementById("firstName").value.trim(),
      last_name: document.getElementById("lastName").value.trim(),
      date: document.getElementById("date").value.trim(),
      time: document.getElementById("time").value.trim(),
      treatment: document.getElementById("treatment").value.trim(),
    };

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Add failed");

      form.reset();
      showToast("Appointment added successfully!", "appointments.html");
    } catch (error) {
      alert("Unable to add appointment.");
    }
  });
}

async function initEditPage() {
  const form = document.getElementById("editAppointmentForm");
  if (!form) return;

  const id = localStorage.getItem("editAppointmentId");
  if (!id) {
    window.location.href = "appointments.html";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) throw new Error("Fetch single failed");

    const data = normalizeAppointment(await res.json());

    document.getElementById("editFirstName").value = data.first_name;
    document.getElementById("editLastName").value = data.last_name;
    document.getElementById("editDate").value = data.date;
    document.getElementById("editTime").value = data.time;
    document.getElementById("editTreatment").value = data.treatment;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const updatedPayload = {
        first_name: document.getElementById("editFirstName").value.trim(),
        last_name: document.getElementById("editLastName").value.trim(),
        date: document.getElementById("editDate").value.trim(),
        time: document.getElementById("editTime").value.trim(),
        treatment: document.getElementById("editTreatment").value.trim(),
      };

      try {
        const updateRes = await fetch(`${API_BASE}/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedPayload),
        });

        if (!updateRes.ok) throw new Error("Update failed");

        showToast("Appointment updated successfully!", "appointments.html");
      } catch (error) {
        alert("Unable to update appointment.");
      }
    });
  } catch (error) {
    alert("Unable to load appointment.");
    window.location.href = "appointments.html";
  }
}

async function initAdminPage() {
  try {
    const appointments = await fetchAppointments();

    const totalAppointments = appointments.length;
    const totalTreatments = new Set(
      appointments.map((item) => item.treatment).filter(Boolean)
    ).size;

    const today = new Date().toISOString().split("T")[0];
    const todayAppointments = appointments.filter((item) => item.date === today).length;

    document.getElementById("totalAppointments").textContent = totalAppointments;
    document.getElementById("todayAppointments").textContent = todayAppointments;
    document.getElementById("totalTreatments").textContent = totalTreatments;

    const tbody = document.getElementById("recentAppointmentsBody");
    if (!tbody) return;

    if (!appointments.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="empty-cell">No appointments available.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = appointments
      .slice(0, 8)
      .map((item) => {
        return `
          <tr>
            <td>${escapeHtml(item.name)}</td>
            <td>${escapeHtml(item.date)}</td>
            <td>${escapeHtml(item.time)}</td>
            <td>${escapeHtml(item.treatment)}</td>
          </tr>
        `;
      })
      .join("");
  } catch (error) {
    const tbody = document.getElementById("recentAppointmentsBody");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="empty-cell">Unable to load admin data.</td>
        </tr>
      `;
    }
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}