<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { IonContent, IonIcon, IonPage } from '@ionic/vue';
import { callOutline, closeCircleOutline } from 'ionicons/icons';
import RideAppHeader from '../components/RideAppHeader.vue';
import RideBottomNav from '../components/RideBottomNav.vue';
import { showError, showSuccess } from '../composables/feedback';

const STORAGE_KEY = 'ride.emergency-contacts';
interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
}

const contacts = ref<EmergencyContact[]>([]);
const name = ref('');
const relationship = ref('');
const phone = ref('');
const phoneError = ref('');
const savedCount = computed(() => contacts.value.length);

function loadContacts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every((item) =>
      typeof item === 'object' && item !== null
      && 'id' in item && typeof item.id === 'string'
      && 'name' in item && typeof item.name === 'string'
      && 'relationship' in item && typeof item.relationship === 'string'
      && 'phone' in item && typeof item.phone === 'string')) {
      throw new Error('Saved emergency contacts have an invalid format.');
    }
    contacts.value = parsed;
  } catch (error) {
    showError(error instanceof Error ? error.message : 'Emergency contacts could not be loaded.');
  }
}

function persistContacts(next: EmergencyContact[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    contacts.value = next;
    return true;
  } catch {
    showError('Emergency contacts could not be saved on this device.');
    return false;
  }
}

function addContact() {
  const normalizedName = name.value.trim();
  const normalizedPhone = phone.value.trim();
  const digitCount = normalizedPhone.replace(/\D/g, '').length;
  phoneError.value = '';
  if (!normalizedName) {
    showError('Enter your contact’s name.');
    return;
  }
  if (digitCount < 7 || digitCount > 15) {
    phoneError.value = 'Enter a phone number with 7 to 15 digits.';
    return;
  }
  const contact: EmergencyContact = {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `contact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: normalizedName,
    relationship: relationship.value.trim(),
    phone: normalizedPhone,
  };
  if (!persistContacts([contact, ...contacts.value])) return;
  name.value = '';
  relationship.value = '';
  phone.value = '';
  showSuccess('Emergency contact saved on this device.');
}

function removeContact(id: string) {
  persistContacts(contacts.value.filter((contact) => contact.id !== id));
}

onMounted(loadContacts);
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="ec-page">
        <RideAppHeader
          eyebrow="Account &amp; Safety"
          title="Emergency Contacts"
          subtitle="Keep important phone numbers easy to find during a trip."
          show-back
        />
        <main class="ec-content desktop-content ride-content">
          <section class="ec-notice" aria-label="Important information">
            <strong>For emergencies</strong>
            <p>These contacts are saved only on this device. RIDE does not call or notify them automatically.</p>
          </section>

          <section class="ec-card" aria-labelledby="ec-form-title">
            <h2 id="ec-form-title">Add a contact</h2>
            <form class="ec-form" @submit.prevent="addContact">
              <label>
                <span>Name</span>
                <input v-model="name" type="text" maxlength="100" autocomplete="name" required placeholder="Contact name" />
              </label>
              <label>
                <span>Relationship <small>(optional)</small></span>
                <input v-model="relationship" type="text" maxlength="60" placeholder="e.g. Family, Friend" />
              </label>
              <label>
                <span>Phone number</span>
                <input
                  v-model="phone"
                  type="tel"
                  maxlength="30"
                  autocomplete="tel"
                  required
                  :aria-invalid="Boolean(phoneError)"
                  aria-describedby="ec-phone-error"
                  placeholder="+63 9XX XXX XXXX"
                  @input="phoneError = ''"
                />
                <small v-if="phoneError" id="ec-phone-error" class="ec-error">{{ phoneError }}</small>
              </label>
              <button class="ec-primary-button" type="submit">Save Contact</button>
            </form>
          </section>

          <section class="ec-list-section" aria-labelledby="ec-list-title">
            <div class="ec-list-heading">
              <h2 id="ec-list-title">Saved contacts</h2>
              <span>{{ savedCount }}</span>
            </div>
            <p v-if="!contacts.length" class="ec-empty">No emergency contacts added yet.</p>
            <article v-for="contact in contacts" :key="contact.id" class="ec-contact">
              <div class="ec-contact-copy">
                <strong>{{ contact.name }}</strong>
                <span v-if="contact.relationship">{{ contact.relationship }}</span>
                <a :href="`tel:${contact.phone}`">
                  <ion-icon :icon="callOutline" aria-hidden="true" />
                  {{ contact.phone }}
                </a>
              </div>
              <button
                class="ec-remove-button"
                type="button"
                :aria-label="`Remove ${contact.name}`"
                @click="removeContact(contact.id)"
              >
                <ion-icon :icon="closeCircleOutline" aria-hidden="true" />
              </button>
            </article>
          </section>
        </main>
        <RideBottomNav active="profile" />
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.ec-page { min-height: 100vh; padding-bottom: calc(104px + env(safe-area-inset-bottom)); background: var(--bg); }
.ec-content { display: grid; gap: 18px; width: min(100%, 760px); margin: 0 auto; padding: 18px 16px 28px; }
.ec-notice { padding: 16px; border: 1px solid var(--border); border-radius: 16px; background: var(--surface-soft); color: var(--text-strong); }
.ec-notice strong { font-size: 15px; }
.ec-notice p { margin: 6px 0 0; color: var(--text-body); font-size: 13px; line-height: 1.5; }
.ec-card, .ec-list-section { padding: 18px; border: 1px solid var(--border); border-radius: 18px; background: var(--surface); box-shadow: 0 4px 16px rgb(23 76 64 / 5%); }
.ec-card h2, .ec-list-heading h2 { margin: 0; color: var(--text-strong); font-size: 18px; }
.ec-form { display: grid; gap: 14px; margin-top: 16px; }
.ec-form label { display: grid; gap: 6px; color: var(--text-body); font-size: 13px; font-weight: 600; }
.ec-form label small { color: var(--text-secondary); font-weight: 400; }
.ec-form input { width: 100%; min-height: 46px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 11px; color: var(--text-strong); font: inherit; }
.ec-form input:focus { outline: 2px solid var(--brand-accent); outline-offset: 1px; }
.ec-error { color: var(--danger) !important; }
.ec-primary-button { display: inline-flex; min-height: 46px; align-items: center; justify-content: center; gap: 8px; border: 0; border-radius: 12px; background: var(--brand); color: var(--on-brand); font: inherit; font-weight: 700; cursor: pointer; }
.ec-list-section { display: grid; gap: 12px; }
.ec-list-heading { display: flex; align-items: center; justify-content: space-between; }
.ec-list-heading span { display: grid; width: 28px; height: 28px; place-items: center; border-radius: 50%; background: var(--surface-soft); color: var(--brand-accent); font-size: 12px; font-weight: 700; }
.ec-empty { margin: 0; color: var(--text-secondary); font-size: 14px; }
.ec-contact { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px; border: 1px solid var(--border); border-radius: 13px; }
.ec-contact-copy { display: grid; min-width: 0; gap: 4px; color: var(--text-strong); }
.ec-contact-copy strong { overflow-wrap: anywhere; }
.ec-contact-copy span { color: var(--text-secondary); font-size: 12px; }
.ec-contact-copy a { display: inline-flex; align-items: center; gap: 6px; color: var(--brand-accent); font-size: 14px; text-decoration: none; }
.ec-remove-button { display: grid; width: 40px; height: 40px; flex: 0 0 auto; place-items: center; border: 0; border-radius: 11px; background: var(--danger-soft); color: var(--danger); font-size: 21px; cursor: pointer; }
@media (min-width: 600px) { .ec-content { padding-right: 24px; padding-left: 24px; } }
</style>
