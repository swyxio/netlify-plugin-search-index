import {
  define,
  useState,
  useEffect
} from 'https://unpkg.com/hooked-elements?module';

define('button.extended', {
  extends: 'button',
  render(element) {
    useEffect(() => {
      console.log('FX on');
      return () => console.log('FX off');
    });
    const [count, update] = useState(0);
    element.onclick = () => update(count + 1);
    element.textContent = `${count} clicks`;
  }
})