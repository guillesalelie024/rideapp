<script setup lang="ts">
import logoMark from '../assets/ride-logo-mark.png';
import wordmark from '../assets/ride-wordmark.png';

withDefaults(defineProps<{
  to?: string;
}>(), {
  to: '/',
});
</script>

<template>
  <router-link class="brand" :to="to" aria-label="RIDE home">
    <img class="brand-mark" :src="logoMark" alt="" />
    <img class="brand-wordmark" :src="wordmark" alt="RIDE" />
  </router-link>
</template>

<style scoped>
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  text-decoration: none;
}

.brand-mark {
  display: block;
  width: 42px;
  height: 50px;
  object-fit: contain;
}

.brand-wordmark {
  display: block;
  width: 86px;
  height: auto;
}
</style>
