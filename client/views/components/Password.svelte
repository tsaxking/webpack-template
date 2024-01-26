<script lang="ts">
import { createEventDispatcher } from 'svelte';
const id = 'password-' + Math.random().toString(36).substr(2, 9);

const dispatch = createEventDispatcher();
export let value = '';
export let placeholder = 'Password';
export let label = 'Password';
let type: 'text' | 'password' = 'password';

const toggle = (t: 'text' | 'password') => {
    type = t === 'text' ? 'password' : 'text';
    const p = document.querySelector('#' + id) as HTMLInputElement;
    if (p) {
        p.type = type;
        p.focus();
    }
};

// const reset = () => {
//     type = 'password';
//     const p = document.querySelector('#' + id) as HTMLInputElement;
//     if (p) {
//         p.type = type;
//     }
// }
</script>

<div class="container-fluid">
    <div class="row p-0 mb-3">
        <div class="col-11 p-0 m-0">
            <div class="form-floating">
                <input
                    class="form-control"
                    name="password"
                    type="password"
                    {id}
                    bind:value
                    {placeholder}
                    on:input="{() => dispatch('input')}"
                />
                <label class="form-label" for="{id}">{label}</label>
            </div>
        </div>
        <div class="col d-flex align-items-center">
            <i
                class="material-icons cursor-pointer mx-auto"
                on:click="{() => toggle(type)}"
            >
                {#if type === 'text'}
                    visibility_off
                {:else}
                    visibility
                {/if}
            </i>
        </div>
    </div>
</div>
