document.addEventListener("DOMContentLoaded", () => {
  const FRAME_DATA_URL = "assets/moldura-trail-run.png";
  const OUTPUT_WIDTH = 1080;
  const OUTPUT_HEIGHT = 1920;

  const canvas = document.getElementById("editorCanvas");
  const photoInput = document.getElementById("photoInput");
  const choosePhotoButton = document.getElementById("choosePhotoButton");
  const zoomRange = document.getElementById("zoomRange");
  const controls = document.getElementById("controls");
  const resetButton = document.getElementById("resetButton");
  const downloadButton = document.getElementById("downloadButton");
  const shareButton = document.getElementById("shareButton");
  const emptyState = document.getElementById("emptyState");
  const previewStatus = document.getElementById("previewStatus");


  if (
    !canvas || !photoInput || !choosePhotoButton || !zoomRange ||
    !controls || !resetButton || !downloadButton || !shareButton ||
    !emptyState || !previewStatus
  ) {
    console.error("Foto do Atleta: elementos obrigatórios não encontrados.");
    return;
  }

  const canvasShell = canvas.closest(".canvas-shell");
  const previewHelp = document.querySelector(".preview-help");
  const adjustButton = document.createElement("button");
  adjustButton.type = "button";
  adjustButton.className = "mobile-adjust-button";
  adjustButton.textContent = "AJUSTAR FOTO";
  adjustButton.hidden = true;

  if (canvasShell) {
    canvasShell.insertAdjacentElement("afterend", adjustButton);
  }

  function setMobileAdjustMode(enabled) {
    mobileAdjustMode = enabled;
    document.body.classList.toggle("photo-adjust-mode", enabled);
    canvas.classList.toggle("adjust-enabled", enabled);
    adjustButton.classList.toggle("active", enabled);
    adjustButton.textContent = enabled ? "CONCLUIR AJUSTE" : "AJUSTAR FOTO";

    if (previewHelp && isMobilePointer()) {
      previewHelp.textContent = enabled
        ? "Arraste a foto para posicionar. Quando terminar, toque em CONCLUIR AJUSTE."
        : "Role a página normalmente. Para mover a foto, toque em AJUSTAR FOTO.";
    }
  }

  adjustButton.addEventListener("click", () => {
    if (!photo) return;
    setMobileAdjustMode(!mobileAdjustMode);
  });

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    alert("Seu navegador não conseguiu iniciar o editor de imagem.");
    return;
  }

  const frame = new Image();

  let photo = null;
  let photoObjectUrl = "";
  let zoom = 1;
  let offsetX = 0;
  let offsetY = 0;
  let dragging = false;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let mobileAdjustMode = false;
  const isMobilePointer = () => window.matchMedia('(max-width: 700px)').matches;

  const mask = {
    cx: OUTPUT_WIDTH * 0.495,
    cy: OUTPUT_HEIGHT * 0.485,
    rx: OUTPUT_WIDTH * 0.365,
    ry: OUTPUT_HEIGHT * 0.355
  };

  function drawBase() {
    ctx.clearRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
  }

  function getCoverScale(image) {
    const targetW = mask.rx * 2.15;
    const targetH = mask.ry * 2.15;

    return Math.max(
      targetW / image.naturalWidth,
      targetH / image.naturalHeight
    );
  }

  function render() {
    drawBase();

    if (photo) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(mask.cx, mask.cy, mask.rx, mask.ry, 0, 0, Math.PI * 2);
      ctx.clip();

      const scale = getCoverScale(photo) * zoom;
      const drawW = photo.naturalWidth * scale;
      const drawH = photo.naturalHeight * scale;
      const x = mask.cx - drawW / 2 + offsetX;
      const y = mask.cy - drawH / 2 + offsetY;

      ctx.drawImage(photo, x, y, drawW, drawH);
      ctx.restore();
    }

    if (frame.complete && frame.naturalWidth > 0) {
      ctx.drawImage(frame, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
    }
  }

  function resetPosition() {
    zoom = 1;
    offsetX = 0;
    offsetY = 0;
    zoomRange.value = "1";
    render();
  }

  function loadPhoto(file) {
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Escolha uma imagem JPG, PNG ou WEBP.");
      photoInput.value = "";
      return;
    }

    if (photoObjectUrl) {
      URL.revokeObjectURL(photoObjectUrl);
    }

    photoObjectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      photo = img;
      resetPosition();

      controls.hidden = false;
      downloadButton.disabled = false;
      shareButton.disabled = false;
      emptyState.hidden = true;
      previewStatus.textContent = "PRONTA PARA AJUSTAR";
      adjustButton.hidden = !isMobilePointer();
      setMobileAdjustMode(false);

      choosePhotoButton.querySelector("strong").textContent = "TROCAR FOTO";
    };

    img.onerror = () => {
      alert("Não foi possível abrir essa foto.");
      photoInput.value = "";
    };

    img.src = photoObjectUrl;
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();

    return {
      x: (event.clientX - rect.left) * (OUTPUT_WIDTH / rect.width),
      y: (event.clientY - rect.top) * (OUTPUT_HEIGHT / rect.height)
    };
  }

  function beginDrag(event) {
    if (!photo) return;
    if (isMobilePointer() && !mobileAdjustMode) return;

    dragging = true;
    canvas.classList.add("dragging");

    if (canvas.setPointerCapture) {
      canvas.setPointerCapture(event.pointerId);
    }

    const p = canvasPoint(event);
    lastPointerX = p.x;
    lastPointerY = p.y;
    event.preventDefault();
  }

  function dragPhoto(event) {
    if (!dragging || !photo) return;
    if (isMobilePointer() && !mobileAdjustMode) return;

    const p = canvasPoint(event);
    offsetX += p.x - lastPointerX;
    offsetY += p.y - lastPointerY;
    lastPointerX = p.x;
    lastPointerY = p.y;

    render();
    event.preventDefault();
  }

  function stopDrag(event) {
    if (!dragging) return;

    dragging = false;
    canvas.classList.remove("dragging");

    if (canvas.releasePointerCapture) {
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch (_) {}
    }
  }

  function canvasToBlob() {
    return new Promise((resolve, reject) => {
      try {
        render();
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Exportação indisponível.")), "image/png");
      } catch (error) {
        reject(error);
      }
    });
  }

  async function downloadImage() {
    if (!photo) {
      alert("Primeiro selecione uma foto.");
      return;
    }

    let blob;
    try {
      blob = await canvasToBlob();
    } catch (error) {
      alert("O navegador bloqueou o download ao abrir o HTML como arquivo. Abra a página em um endereço web e tente novamente.");
      return;
    }

    if (!blob) {
      alert("Não foi possível gerar a imagem.");
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "eu-vou-itaitinga-trail-run-2026.png";
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function shareImage() {
    if (!photo) {
      alert("Primeiro selecione uma foto.");
      return;
    }

    let blob;
    try {
      blob = await canvasToBlob();
    } catch (error) {
      alert("O navegador bloqueou o compartilhamento ao abrir o HTML como arquivo. Abra a página em um endereço web e tente novamente.");
      return;
    }

    if (!blob) {
      alert("Não foi possível gerar a imagem.");
      return;
    }

    const file = new File(
      [blob],
      "eu-vou-itaitinga-trail-run-2026.png",
      { type: "image/png" }
    );

    try {
      if (
        navigator.share &&
        (!navigator.canShare || navigator.canShare({ files: [file] }))
      ) {
        await navigator.share({
          title: "Itaitinga MTB Race 2026",
          text: "Eu vou para o Itaitinga MTB Race 2026!",
          files: [file]
        });
        return;
      }
    } catch (error) {
      if (error && error.name === "AbortError") return;
      console.warn("Compartilhamento direto indisponível:", error);
    }

    await downloadImage();
  }

  choosePhotoButton.addEventListener("click", () => {
    photoInput.click();
  });

  photoInput.addEventListener("change", () => {
    loadPhoto(photoInput.files && photoInput.files[0]);
  });

  zoomRange.addEventListener("input", () => {
    zoom = Number(zoomRange.value);
    render();
  });

  resetButton.addEventListener("click", resetPosition);
  downloadButton.addEventListener("click", downloadImage);
  shareButton.addEventListener("click", shareImage);

  canvas.addEventListener("pointerdown", beginDrag);
  canvas.addEventListener("pointermove", dragPhoto);
  canvas.addEventListener("pointerup", stopDrag);
  canvas.addEventListener("pointercancel", stopDrag);
  canvas.addEventListener("pointerleave", (event) => {
    if (dragging && event.buttons === 0) stopDrag(event);
  });

  window.addEventListener("resize", () => {
    if (!isMobilePointer()) {
      setMobileAdjustMode(false);
      adjustButton.hidden = true;
    } else if (photo) {
      adjustButton.hidden = false;
    }
  });

  frame.onload = render;
  frame.onerror = () => {
    console.error("Não foi possível carregar a moldura incorporada.");
    previewStatus.textContent = "ERRO AO CARREGAR MOLDURA";
  };
  frame.src = FRAME_DATA_URL;

  render();
});
