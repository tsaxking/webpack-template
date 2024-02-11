<script lang="ts">
    import { Modal } from '../../../utilities/modals';
    import { Random } from '../../../../shared/math';
    const id = 'input-' + Random.uuid();
    let input: HTMLInputElement;
    export let multiple: boolean = true;

    let pictures: string[] = [];

    const fns = {
        onInput: async (e: Event) => {
            const { files } = input;
            if (files) {
                pictures = [
                ...(multiple ? pictures : []),
                ...await Promise.all(Array.from(files).map(f => new Promise<string>((res, rej) => {
                    const reader = new FileReader();
                    reader.onload = () => res(reader.result as string);
                    reader.onerror = rej;
                    reader.readAsDataURL(f);
                })))];
            }
        }
    };
</script>

<div class="container">
    <div class="row mb-3">
        <div class="col-md-6">
            <input type="file" name="" id={id} class="form-control" {multiple} bind:this={input} on:change={fns.onInput} accept=".png,.PNG,.jpg,.JPG,.jpeg,.JPEG">
        </div>
        <div class="col-md-6">
            <button type="button" class="btn btn-primary">Preview</button>
        </div>
    </div>
    <div class="row mb-3">
        {#each pictures as picture, i}
            <div class="col">
                <img src={picture} alt="picture {i}" class="img-thumbnail">
            </div>
        {/each}
    </div>
</div>
