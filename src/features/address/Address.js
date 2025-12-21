"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./address.module.scss";
import axios from "axios";
import api from "@/axiosInstance/axiosInstance";

const Address = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  const searchInputRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    country: "India",
    pinCode: "",
  });

  const [addressList, setAddressList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [defaultAddressId, setDefaultAddressId] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState(null); // 👈 for edit mode
  const [activeMenuId, setActiveMenuId] = useState(null); // 👈 for 3-dot menu toggle

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isFormValid =
    form.name &&
    form.mobile &&
    form.line1 &&
    form.city &&
    form.state &&
    form.pinCode;

const postNewAddress = async () => {
  if (!isFormValid) return;
  setIsSubmitting(true);

  try {
    const method = selectedAddressId ? "patch" : "put";
    const url = selectedAddressId
      ? `/v1/address?addressId=${selectedAddressId}`
      : `/v1/address`;

    const payload = { ...form };

    // Using the same api instance as getAddressList
    const res = await api[method](url, payload);

    if (res.status === 200) {
      alert(selectedAddressId ? "Address updated successfully!" : "Address added successfully!");
      resetForm();
      getAddressList();
      setShowForm(false);
      setSelectedAddressId(null);
    }
  } catch (error) {
    console.error("Error saving/updating address:", error.response?.data || error);
  } finally {
    setIsSubmitting(false);
  }
};



  const resetForm = () => {
    setForm({
      name: "",
      mobile: "",
      email: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      country: "India",
      pinCode: "",
    });
  };


  const getAddressList = async () => {
    try {
      const res = await api.get(`/v1/address/all`, {
        headers: {
          "x-api-key":
            "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
        },
      });
      setAddressList(res?.data?.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  // 🟢 Set as default
  const setDefaultAddress = async (id) => {
    setDefaultAddressId(id);
    alert("Default address set!");
    setActiveMenuId(null);
    // optionally update backend default flag here
  };

  // 🟢 Handle edit action
  const handleEdit = (address) => {
    setForm({
      name: address.name || "",
      mobile: address.mobile || "",
      email: address.email || "",
      line1: address.line1 || "",
      line2: address.line2 || "",
      city: address.city || "",
      state: address.state || "",
      country: address.country || "India",
      pinCode: address.pinCode || "",
    });
    setSelectedAddressId(address.id);
    setShowForm(true);
    setActiveMenuId(null);
  };

  // 🟢 Google Autocomplete
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places`;
      script.async = true;
      script.onload = initAutocomplete;
      document.body.appendChild(script);
    } else {
      initAutocomplete();
    }
  }, []);

  const initAutocomplete = () => {
    if (!searchInputRef.current) return;
    const autocomplete = new window.google.maps.places.Autocomplete(
      searchInputRef.current,
      { types: ["address"] }
    );

    autocomplete.setFields([
      "address_component",
      "formatted_address",
      "geometry",
    ]);

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.address_components) return;

      const address = {
        line1: "",
        line2: "",
        city: "",
        state: "",
        pinCode: "",
        country: "India",
      };

      place.address_components.forEach((component) => {
        const types = component.types;
        if (types.includes("street_number"))
          address.line1 = component.long_name + " " + address.line1;
        if (types.includes("route")) address.line1 += component.long_name;
        if (types.includes("sublocality") || types.includes("neighborhood"))
          address.line2 = component.long_name;
        if (types.includes("locality")) address.city = component.long_name;
        if (types.includes("administrative_area_level_1"))
          address.state = component.long_name;
        if (types.includes("postal_code"))
          address.pinCode = component.long_name;
        if (types.includes("country")) address.country = component.long_name;
      });

      setForm((prev) => ({ ...prev, ...address }));
    });
  };

  useEffect(() => {
    getAddressList();
  }, []);


  const DefaultAddress = async (id) => {
  try {
    const res = await axios.patch(
      `${apiUrl}/v1/address/changeDefaultAddress`,
      { newDefaultAddressId: id },
      {
        headers: {
          "x-api-key":
            "454ccaf106998a71760f6729e7f9edaf1df17055b297b3008ff8b65a5efd7c10",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_TOKEN}`,
        },
      }
    );

    if (res.status === 200) {
      alert("Default address set successfully!");
      setDefaultAddressId(id);
      setActiveMenuId(null);
      getAddressList();
    }
  } catch (error) {
    console.error("Error setting default address:", error.response?.data || error);
  }
};

 

  return (
    <div className={styles.container}>
      {addressList.length > 0 && !showForm && (
        <div className={styles.savedAddressContainer}>
          <h3 className={styles.savedHeading}>Saved Addresses</h3>

          <div className={styles.addressList}>
            {addressList.map((address) => (
              <div
                key={address.id}
                className={`${styles.addressItem} ${
                  address.isDefault ? styles.defaultBorder : ""
                }`}
              >
                <div className={styles.addressText}>
                  <h4 className={styles.addressName}>{address.name}</h4>
                  <p className={styles.mobileText}>
                    Mobile No. {address.mobile}
                  </p>
                  <p className={styles.addressLine}>
                    {address.line1 && `${address.line1}, `}
                    {address.line2 && `${address.line2}, `}
                  </p>
                  <p>
                    {address.city && `${address.city}, `}
                    {address.state && `${address.state}, `}
                    {address.country && `${address.country}-`}
                    {address.pinCode}
                  </p>
                </div>

                {/* ⋯ 3-dot Menu */}
                <div
                  className={styles.menuIcon}
                  onClick={() =>
                    setActiveMenuId(
                      activeMenuId === address.id ? null : address.id
                    )
                  }
                >
                  ⋯
                  {activeMenuId === address.id && (
                    <div className={styles.menuDropdown}>
                      <p onClick={() => DefaultAddress(address.id)}>
                        Set as Default
                      </p>
                      <p onClick={() => handleEdit(address)}>Edit</p>
                    </div>
                  )}
                </div>

                {/* ✅ Default Address Label */}
                {address.isDefault && (
                  <span className={styles.defaultLabel}>Default Address</span>
                )}
              </div>
            ))}
          </div>

          <button
            className={styles.addNewAddress}
            onClick={() => {
              resetForm();
              setSelectedAddressId(null);
              setShowForm(true);
            }}
          >
            ADD NEW ADDRESS <span className={styles.plus}>+</span>
          </button>
        </div>
      )}

      {(showForm || addressList.length === 0) && (
        <div className={styles.formContainer}>
          <div
            className={styles.backSection}
            onClick={() => setShowForm(false)}
          >
            <button className={styles.backButton}>&#8592; Back</button>
          </div>
          <h3 className={styles.formTitle}>
            {selectedAddressId ? "Edit Address" : "Add New Address"}
          </h3>

          <div className={styles.saveAsSection}>
            <label>Save address as</label>
            <div className={styles.inputGroup}>
              <input
                type="text"
                placeholder="Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                className={styles.nameInput}
              />
              <input
                type="text"
                placeholder="Mobile"
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                className={styles.nameInput}
              />
            </div>
          </div>

          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search your nearest building or location"
              ref={searchInputRef}
              className={styles.searchInput}
            />
            <span className={styles.poweredBy}>Powered by Google</span>
          </div>

          <div className={styles.addressFields}>
            <input
              type="text"
              placeholder="Flat / House no / Floor / Building *"
              name="line1"
              value={form.line1}
              onChange={handleChange}
              className={styles.input}
            />
            <input
              type="text"
              placeholder="Road name / Area / Colony"
              name="line2"
              value={form.line2}
              onChange={handleChange}
              className={styles.input}
            />
            <div className={styles.row}>
              <input
                type="text"
                placeholder="Pincode"
                name="pinCode"
                value={form.pinCode}
                onChange={handleChange}
                className={styles.halfInput}
              />
              <input
                type="text"
                placeholder="City"
                name="city"
                value={form.city}
                onChange={handleChange}
                className={styles.halfInput}
              />
            </div>
            <input
              type="text"
              placeholder="State"
              name="state"
              value={form.state}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          <div className={styles.formActions}>
            <button
              className={styles.saveButton}
              onClick={postNewAddress}
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : selectedAddressId
                ? "Update"
                : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Address;
