<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { IonIcon } from '@ionic/vue';
import { getRideSession } from '../data/api';
import { PROFILE_AVATAR_OPTIONS } from '../data/profileAvatars';

const user = ref(getRideSession()?.user ?? null);
const avatar = computed(() => PROFILE_AVATAR_OPTIONS.find((option) => option.id === user.value?.avatar));

function refreshAvatar() {
  user.value = getRideSession()?.user ?? null;
}

onMounted(() => window.addEventListener('ride:profile-updated', refreshAvatar));
onBeforeUnmount(() => window.removeEventListener('ride:profile-updated', refreshAvatar));
</script>

<template>
  <span class="ride-profile-avatar" :data-avatar="avatar?.id ?? 'default'">
    <ion-icon :icon="avatar?.icon ?? PROFILE_AVATAR_OPTIONS[0].icon" aria-hidden="true"></ion-icon>
  </span>
</template>
