import Image from 'next/image';

export default function Contact() {
    return (
        <div>
            <div>THIS IS THE BEST PROJECT EVER DONE IN NTU'S HISTORY!!!</div>
            <div>
                <Image
                    //className="dark:invert"
                    src="https://www.breatheazy.co.uk/wp-content/uploads/2023/09/Untitled-design-35-1080x675.png"
                    alt="Cat."
                    width={2000}
                    height={1500}
                />
            </div>
        </div>
    );
}