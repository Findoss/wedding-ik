// player.js
document.addEventListener('DOMContentLoaded', () => {
    // Логика работы плеера
    const audio = document.getElementById('wedding-audio');
    const playBtn = document.getElementById('audio-play-btn');
    const iconPlay = document.getElementById('icon-play');
    const iconPause = document.getElementById('icon-pause');

    if (!audio || !playBtn) return; // Проверка, что плеер есть на странице

    let isPlaying = false;

    // Переключение воспроизведения
    playBtn.addEventListener('click', () => {
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play().catch(e => {
                console.log('Воспроизведение не удалось (скорее всего файл не найден или блокировка браузера):', e);
                alert("Не удалось запустить музыку. Проверьте, добавлен ли файл (например, music.mp3) в папку с проектом.");
            });
        }
    });

    // Изменение иконок
    audio.addEventListener('play', () => {
        isPlaying = true;
        iconPlay.style.display = 'none';
        iconPause.style.display = 'block';
    });

    audio.addEventListener('pause', () => {
        isPlaying = false;
        iconPlay.style.display = 'block';
        iconPause.style.display = 'none';
    });
});
