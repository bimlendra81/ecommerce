const BASE = 'https://api.goshippo.com';

function parcelDims(settings = {}) {
  return {
    length: String(Number(settings.shipping_parcel_length) > 0 ? Number(settings.shipping_parcel_length) : 10),
    width: String(Number(settings.shipping_parcel_width) > 0 ? Number(settings.shipping_parcel_width) : 10),
    height: String(Number(settings.shipping_parcel_height) > 0 ? Number(settings.shipping_parcel_height) : 10),
  };
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

// Normalize common country names (full names) to ISO-2 codes.
const COUNTRY2 = {
  'UNITED STATES': 'US', 'USA': 'US', 'U.S.A.': 'US', 'AMERICA': 'US',
  'INDIA': 'IN', 'BHARAT': 'IN',
  'UNITED KINGDOM': 'GB', 'GREAT BRITAIN': 'GB', 'UK': 'GB',
  'UNITED ARAB EMIRATES': 'AE', 'UAE': 'AE',
  'GERMANY': 'DE', 'FRANCE': 'FR', 'ITALY': 'IT', 'SPAIN': 'ES',
  'CANADA': 'CA', 'AUSTRALIA': 'AU', 'JAPAN': 'JP', 'CHINA': 'CN',
  'SINGAPORE': 'SG', 'MALAYSIA': 'MY', 'THAILAND': 'TH',
  'BRAZIL': 'BR', 'MEXICO': 'MX', 'NETHERLANDS': 'NL', 'BELGIUM': 'BE',
  'SWITZERLAND': 'CH', 'SWEDEN': 'SE', 'NORWAY': 'NO', 'DENMARK': 'DK',
  'POLAND': 'PL', 'PORTUGAL': 'PT', 'RUSSIA': 'RU', 'TURKEY': 'TR',
  'INDONESIA': 'ID', 'PHILIPPINES': 'PH', 'VIETNAM': 'VN', 'SOUTH KOREA': 'KR',
  'NEW ZEALAND': 'NZ', 'SOUTH AFRICA': 'ZA', 'EGYPT': 'EG', 'ISRAEL': 'IL',
  'SAUDI ARABIA': 'SA', 'QATAR': 'QA', 'KUWAIT': 'KW', 'BANGLADESH': 'BD',
  'PAKISTAN': 'PK', 'SRI LANKA': 'LK', 'NEPAL': 'NP',
};

function toC2(input) {
  if (!input) return 'US';
  const s = String(input).trim();
  if (!s) return 'US';
  if (/^[A-Za-z]{2}$/.test(s)) return s.toUpperCase();
  return COUNTRY2[s.toUpperCase()] || s.toUpperCase().slice(0, 2);
}

const INDIA_ST = {
  'ANDHRA PRADESH': 'AP', 'ARUNACHAL PRADESH': 'AR', 'ASSAM': 'AS', 'BIHAR': 'BR',
  'CHHATTISGARH': 'CG', 'GOA': 'GA', 'GUJARAT': 'GJ', 'HARYANA': 'HR',
  'HIMACHAL PRADESH': 'HP', 'JAMMU AND KASHMIR': 'JK', 'JHARKHAND': 'JH',
  'KARNATAKA': 'KA', 'KERALA': 'KL', 'MADHYA PRADESH': 'MP', 'MAHARASHTRA': 'MH',
  'MANIPUR': 'MN', 'MEGHALAYA': 'ML', 'MIZORAM': 'MZ', 'NAGALAND': 'NL',
  'ODISHA': 'OD', 'ORISSA': 'OD', 'PUNJAB': 'PB', 'RAJASTHAN': 'RJ',
  'SIKKIM': 'SK', 'TAMIL NADU': 'TN', 'TELANGANA': 'TS', 'TRIPURA': 'TR',
  'UTTAR PRADESH': 'UP', 'UTTARAKHAND': 'UK', 'UTTARANCHAL': 'UK',
  'WEST BENGAL': 'WB', 'DELHI': 'DL', 'CHANDIGARH': 'CH',
  'PUDUCHERRY': 'PY', 'PONDICHERRY': 'PY',
};

const US_ST = {
  'ALABAMA': 'AL', 'ALASKA': 'AK', 'ARIZONA': 'AZ', 'ARKANSAS': 'AR',
  'CALIFORNIA': 'CA', 'COLORADO': 'CO', 'CONNECTICUT': 'CT', 'DELAWARE': 'DE',
  'FLORIDA': 'FL', 'GEORGIA': 'GA', 'HAWAII': 'HI', 'IDAHO': 'ID',
  'ILLINOIS': 'IL', 'INDIANA': 'IN', 'IOWA': 'IA', 'KANSAS': 'KS',
  'KENTUCKY': 'KY', 'LOUISIANA': 'LA', 'MAINE': 'ME', 'MARYLAND': 'MD',
  'MASSACHUSETTS': 'MA', 'MICHIGAN': 'MI', 'MINNESOTA': 'MN', 'MISSISSIPPI': 'MS',
  'MISSOURI': 'MO', 'MONTANA': 'MT', 'NEBRASKA': 'NE', 'NEVADA': 'NV',
  'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ', 'NEW MEXICO': 'NM', 'NEW YORK': 'NY',
  'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', 'OHIO': 'OH', 'OKLAHOMA': 'OK',
  'OREGON': 'OR', 'PENNSYLVANIA': 'PA', 'RHODE ISLAND': 'RI',
  'SOUTH CAROLINA': 'SC', 'SOUTH DAKOTA': 'SD', 'TENNESSEE': 'TN',
  'TEXAS': 'TX', 'UTAH': 'UT', 'VERMONT': 'VT', 'VIRGINIA': 'VA',
  'WASHINGTON': 'WA', 'WEST VIRGINIA': 'WV', 'WISCONSIN': 'WI',
  'WYOMING': 'WY', 'DISTRICT OF COLUMBIA': 'DC',
};

function toS2(state, country) {
  if (!state) return '';
  const s = String(state).trim();
  if (!s) return '';
  if (/^[A-Za-z]{2}$/.test(s)) return s.toUpperCase();
  const u = s.toUpperCase();
  const c = toC2(country);
  if (c === 'IN' && INDIA_ST[u]) return INDIA_ST[u];
  if (c === 'US' && US_ST[u]) return US_ST[u];
  const alpha = u.replace(/[^A-Z]/g, '');
  return alpha.slice(0, 2) || u.slice(0, 2);
}

export class ShippoAdapter {
  constructor(settings = {}) {
    this.settings = settings;
  }

  get name() {
    return 'shippo';
  }

  isConfigured() {
    return Boolean(this.settings.shippo_token);
  }

  headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: `ShippoToken ${this.settings.shippo_token}`,
    };
  }

  isExpress(methodName) {
    return /express|priority|next|fast/i.test(methodName || '');
  }

  originAddress() {
    return {
      name: this.settings.shipping_origin_name || this.settings.site_title || 'Store',
      company: this.settings.site_title || 'Store',
      street1: this.settings.shipping_origin_street1 || '',
      street2: this.settings.shipping_origin_street2 || '',
      city: this.settings.shipping_origin_city || '',
      state: toS2(this.settings.shipping_origin_state, this.settings.shipping_origin_country),
      zip: this.settings.shipping_origin_postcode || '',
      country: toC2(this.settings.shipping_origin_country),
      email: this.settings.shipping_origin_email || this.settings.contact_email || '',
      phone: this.settings.shipping_origin_phone || this.settings.contact_phone || '',
    };
  }

  destinationAddress(destination) {
    return {
      name: destination.user_name || destination.full_name || destination.name || '',
      street1: destination.address_line1 || '',
      street2: destination.address_line2 || '',
      city: destination.city || '',
      state: toS2(destination.state, destination.country),
      zip: destination.postal_code || '',
      country: toC2(destination.country),
      phone: destination.phone || '',
      email: destination.email || '',
    };
  }

  async rateFor({ weight, destination, method }) {
    if (!this.isConfigured()) return null;
    const body = {
      address_from: this.originAddress(),
      address_to: this.destinationAddress(destination),
      parcels: [
        {
          ...parcelDims(this.settings),
          distance_unit: 'in',
          weight: String(Math.max(round2(weight / 453.592), 0.1)),
          mass_unit: 'lb',
        },
      ],
      async: false,
    };
    const res = await fetch(`${BASE}/shipments`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      let detail = text;
      try { detail = JSON.parse(text)?.detail || text; } catch {}
      let message = `Shippo rates failed (${res.status})`;
      if (detail) message += `: ${detail}`;
      if (res.status === 404) {
        message += ' - Shippo 404: verify the Shippo account for this token has carrier accounts enabled (Shippo dashboard > Test carriers) and that the token is valid.';
      }
      return { error: message };
    }
    const data = await res.json();
    const rates = data?.rates || [];
    if (rates.length === 0) return null;

    const usable = rates.filter((r) => Number(r.amount) > 0);
    if (usable.length === 0) return null;

    let chosen;
    if (this.isExpress(method.name)) {
      chosen = [...usable].sort((a, b) => (a.estimated_days || 99) - (b.estimated_days || 99))[0];
    } else {
      chosen = [...usable].sort((a, b) => Number(a.amount) - Number(b.amount))[0];
    }

    const days = Number(chosen.estimated_days) || 5;
    return {
      fee: round2(chosen.amount),
      estimated_days_min: Math.max(days, 1),
      estimated_days_max: Math.max(days + 2, days),
      carrier: `${chosen.provider} ${chosen.servicelevel?.name || ''}`.trim() || 'shippo',
    };
  }

  async listRates({ parcel, destination, items, amount }) {
    // Returns ALL usable rates with rate_id (customer picks one at checkout)
    if (!this.isConfigured()) return [];
    const body = {
      address_from: this.originAddress(),
      address_to: this.destinationAddress(destination),
      parcels: [
        {
          length: String(parcel.length_cm || 0),
          width: String(parcel.width_cm || 0),
          height: String(parcel.height_cm || 0),
          distance_unit: 'cm',
          weight: String(Math.max(round2((parcel.parcelWeightGrams || 0) / 1000), 0.1)),
          mass_unit: 'kg',
        },
      ],
      async: false,
    };
    // International shipments need a customs declaration attached to the shipment
    // itself, otherwise the rate can never be purchased (label transaction fails
    // with "Customs declaration is required for international shipments").
    const originCountry = toC2(this.settings.shipping_origin_country);
    const destCountry = toC2(destination?.country || destination?.country_code2);
    if (originCountry !== destCountry) {
      const customs = await this.customsDeclaration(items, parcel.parcelWeightGrams || 0, amount || 0);
      body.customs_declaration = customs.object_id;
    }
    const res = await fetch(`${BASE}/shipments`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      let detail = text;
      try { detail = JSON.parse(text)?.detail || text; } catch {}
      const message = `Shippo rates failed (${res.status})${detail ? `: ${detail}` : ''}`;
      throw new Error(message);
    }
    const data = await res.json();
    const rates = (data?.rates || []).filter((r) => Number(r.amount) > 0);
    return rates.map((r) => {
      const days = Number(r.estimated_days) || null;
      return {
        rate_id: r.object_id,
        provider: r.provider || '',
        service: (r.servicelevel?.name || '').trim(),
        carrier: `${r.provider || ''} ${r.servicelevel?.name || ''}`.trim() || 'shippo',
        amount: round2(r.amount),
        currency: r.currency || 'USD',
        estimated_days: days,
        estimated_days_min: days ? Math.max(days, 1) : null,
        estimated_days_max: days ? Math.max(days + 2, days) : null,
        shipping_days: days,
      };
    });
  }

  async buyLabel({ rate_id, label_file_type = 'PDF' }) {
    // POST /transactions/ — creates the actual shipping label (after payment success)
    const body = {
      rate: rate_id,
      label_file_type,
      async: false,
    };
    const res = await fetch(`${BASE}/transactions/`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      let detail = text;
      try { detail = JSON.parse(text)?.detail || text; } catch {}
      throw new Error(`Shippo transaction failed (${res.status})${detail ? `: ${detail}` : ''}`);
    }
    const t = await res.json();
    if (t.status === 'ERROR' || !t.label_url) {
      const msgs = (t.messages || [])
        .map((m) => m.text || m.message || JSON.stringify(m))
        .filter(Boolean)
        .join('; ');
      throw new Error(`Shippo transaction failed: ${msgs || 'label not generated'}`);
    }
    return {
      object_id: t.object_id || '',
      rate_id: t.rate || rate_id,
      carrier: `${t.provider || ''} ${t.servicelevel?.name || ''}`.trim() || 'shippo',
      service: (t.servicelevel?.name || '').trim(),
      tracking_number: t.tracking_number || '',
      tracking_url: t.tracking_url_provider || '',
      label_url: t.label_url || '',
      status: t.status || 'PURCHASED',
    };
  }

  async customsDeclaration(items, weight, amount) {
    const contents = (items || []).map((it) => ({
      description: (it.product_name || it.name || 'Merchandise').slice(0, 70),
      quantity: Math.max(Number(it.quantity) || 1, 1),
      value_amount: String(round2(Number(it.price) || 0)),
      net_weight: String(Math.max(Number(it.weight_grams) || 0, 1)),
      mass_unit: 'g',
      origin_country: toC2(this.settings.shipping_origin_country),
      value_currency: 'USD',
    }));
    if (contents.length === 0) {
      contents.push({
        description: 'Merchandise',
        quantity: 1,
        value_amount: String(Math.max(round2(Number(amount) || 0), 1)),
        net_weight: String(Math.max(Math.round(Number(weight) || 0), 1)),
        mass_unit: 'g',
        origin_country: toC2(this.settings.shipping_origin_country),
        value_currency: 'USD',
      });
    }
    const body = {
      items: contents,
      non_delivery_option: 'RETURN',
      certify: true,
      certify_signer: this.settings.shipping_origin_name || this.settings.site_title || 'Store owner',
      contents_type: 'MERCHANDISE',
      eel_pfc: 'NOEEI_30_37_a',
      incoterm: 'DDU',
    };
    const res = await fetch(`${BASE}/customs/declarations`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Shippo customs declaration failed (${res.status}): ${text}`);
    }
    return res.json();
  }

  async _createShipmentAndRates({ order, info, items, settings, parcel }) {
    if (!this.isConfigured()) {
      throw new Error('Shippo is not configured. Add an API token in Admin > Shipping.');
    }
    const weight = Number(order?.weight) || 0;
    const amount = Number(order?.total) || Number(order?.amount) || 0;
    const addressFrom = this.originAddress();
    const addressTo = this.destinationAddress(info);
    const isIntl = addressFrom.country !== addressTo.country;

    const pkg = parcel || {
      ...parcelDims(settings),
      distance_unit: 'in',
      weight: String(Math.max(round2(weight / 453.592), 0.1)),
      mass_unit: 'lb',
    };

    const lineItems = (items || []).map((it) => {
      const qty = Math.max(Number(it.quantity) || 1, 1);
      return {
        sku: String(it.sku || it.variant_sku || ''),
        title: String(it.product_name || it.name || 'Item').slice(0, 120),
        quantity: qty,
        weight: String(Math.max(Number(it.weight_grams) || 0.1, 0.1)),
        weight_unit: 'g',
        value_amount: String(round2(Number(it.price) || 0)),
        value_currency: this.settings.currency || 'USD',
        origin_country: toC2(this.settings.shipping_origin_country),
        ...((it.hs_code || it.tariff_number) ? { tariff_number: String(it.hs_code || it.tariff_number) } : {}),
      };
    });

    const shipmentBody = {
      address_from: addressFrom,
      address_to: addressTo,
      parcels: [pkg],
      async: false,
    };

    if (lineItems.length > 0) shipmentBody.line_items = lineItems;

    if (isIntl) {
      const customs = await this.customsDeclaration(items, weight, amount);
      shipmentBody.customs_declaration = customs.object_id;
    }

    const created = await fetch(`${BASE}/shipments`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(shipmentBody),
    });
    const createdText = await created.text();
    let shipment;
    try { shipment = JSON.parse(createdText); } catch {}
    if (!created.ok) {
      const detail = shipment?.detail || createdText;
      throw new Error(`Shippo shipment create failed (${created.status}): ${detail}`);
    }

    const rates = shipment?.rates || [];
    if (rates.length === 0) {
      throw new Error('Shippo returned no rates for this shipment');
    }
    return { shipment, rates };
  }

  async createShipment({ order, info, items, settings }) {
    const { shipment, rates } = await this._createShipmentAndRates({ order, info, items, settings });
    const cheapest = [...rates].sort((a, b) => Number(a.amount) - Number(b.amount))[0];

    const purchased = await fetch(
      `${BASE}/shipments/${shipment.object_id}/rates/${cheapest.object_id}`,
      { method: 'POST', headers: this.headers() }
    );
    if (!purchased.ok) {
      const ptext = await purchased.text();
      throw new Error(`Shippo rate purchase failed (${purchased.status}): ${ptext}`);
    }
    const result = await purchased.json();
    const tracking = result.tracking_number || `${order.id}-${Date.now().toString().slice(-6)}`;
    return {
      carrier: `${result.provider || cheapest.provider || 'shippo'} ${result.servicelevel?.name || ''}`.trim(),
      tracking_number: tracking,
      tracking_url: result.label_url || '',
      events: [
        {
          event: result.tracking_status?.status || 'Label created',
          location: '',
          notes: 'Shipment created via Shippo',
        },
      ],
    };
  }

  async createAndBuyLabel({ order, info, items, settings }) {
    // For the "Shippo (International)" method (no stored rate): build the shipment
    // (with customs if international), pick the cheapest rate and purchase a real
    // label through a Shippo transaction.
    const { rates } = await this._createShipmentAndRates({ order, info, items, settings });
    const cheapest = [...rates].sort((a, b) => Number(a.amount) - Number(b.amount))[0];
    const labelFileType = settings?.shippo_label_file_type || this.settings.shippo_label_file_type || 'PDF';
    const result = await this.buyLabel({ rate_id: cheapest.object_id, label_file_type: labelFileType });
    return {
      ...result,
      carrier: `${result.carrier || cheapest.provider || 'shippo'}`.trim(),
    };
  }

  async track({ carrier, tracking_number }) {
    if (!this.isConfigured()) return { events: [] };
    const provider = (carrier || 'shippo').split(' ')[0].toLowerCase();
    const res = await fetch(`${BASE}/tracks/${provider}/${encodeURIComponent(tracking_number)}`, {
      headers: this.headers(),
    });
    if (!res.ok) return { events: [] };
    const data = await res.json();
    const history = data?.tracking_history || [];
    const events = history.map((h) => ({
      event: h.status || 'In transit',
      location: h.location?.city || '',
      notes: h.status_details || '',
      created_at: h.status_date || null,
    }));
    return { events };
  }
}