import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// CPK color scheme for atoms (standard scientific convention)
const ATOM_COLORS: Record<string, string> = {
    'C': '#404040',   // Carbon: dark gray
    'H': '#FFFFFF',   // Hydrogen: white
    'O': '#FF0000',   // Oxygen: red
    'N': '#0000FF',   // Nitrogen: blue
    'S': '#FFFF00',   // Sulfur: yellow
    'P': '#FFA500',   // Phosphorus: orange
    'F': '#00FF00',   // Fluorine: green
    'Cl': '#00FF00',  // Chlorine: green
    'Br': '#8B0000',  // Bromine: dark red
    'I': '#9400D3',   // Iodine: purple
    'Na': '#0000FF',  // Sodium: blue
    'K': '#8B008B',   // Potassium: purple
    'Ca': '#00FF00',  // Calcium: green
    'Fe': '#FFA500',  // Iron: orange
    'Mg': '#228B22',  // Magnesium: forest green
    'Zn': '#7D7D7D',  // Zinc: gray
};

// Atomic radii for ball representation (in Angstroms, scaled)
const ATOM_RADII: Record<string, number> = {
    'C': 0.35,
    'H': 0.25,
    'O': 0.30,
    'N': 0.32,
    'S': 0.40,
    'P': 0.38,
    'F': 0.28,
    'Cl': 0.35,
    'Br': 0.40,
    'I': 0.45,
};

interface Atom {
    id: number;
    symbol: string;
    x: number;
    y: number;
    z: number;
}

interface Bond {
    start: number;
    end: number;
    type: number; // 1=single, 2=double, 3=triple
}

interface MoleculeData {
    drug_id: string;
    drug_name: string;
    atoms: Atom[];
    bonds: Bond[];
    atom_count: number;
    bond_count: number;
    error?: string;
}

interface AtomSphereProps {
    atom: Atom;
    scale: number;
}

function AtomSphere({ atom, scale }: AtomSphereProps) {
    const color = ATOM_COLORS[atom.symbol] || '#808080';
    const radius = (ATOM_RADII[atom.symbol] || 0.3) * scale;

    return (
        <mesh position={[atom.x * scale, atom.y * scale, atom.z * scale]}>
            <sphereGeometry args={[radius, 32, 32]} />
            <meshStandardMaterial
                color={color}
                roughness={0.6}
                metalness={0.1}
            />
        </mesh>
    );
}

interface BondCylinderProps {
    atoms: Atom[];
    bond: Bond;
    scale: number;
}

function BondCylinder({ atoms, bond, scale }: BondCylinderProps) {
    const startAtom = atoms[bond.start];
    const endAtom = atoms[bond.end];

    if (!startAtom || !endAtom) return null;

    const start = new THREE.Vector3(
        startAtom.x * scale,
        startAtom.y * scale,
        startAtom.z * scale
    );
    const end = new THREE.Vector3(
        endAtom.x * scale,
        endAtom.y * scale,
        endAtom.z * scale
    );

    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

    // Calculate rotation to align cylinder with bond
    const quaternion = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    quaternion.setFromUnitVectors(up, direction.clone().normalize());

    const bondRadius = 0.06 * scale;

    // For double/triple bonds, we'd add multiple cylinders offset
    // For simplicity, single cylinder with varying thickness
    const finalRadius = bond.type === 1 ? bondRadius :
        bond.type === 2 ? bondRadius * 1.3 :
            bondRadius * 1.6;

    return (
        <mesh position={center} quaternion={quaternion}>
            <cylinderGeometry args={[finalRadius, finalRadius, length, 16]} />
            <meshStandardMaterial
                color="#606060"
                roughness={0.7}
                metalness={0.1}
            />
        </mesh>
    );
}

interface MoleculeProps {
    atoms: Atom[];
    bonds: Bond[];
    isRotating: boolean;
}

function Molecule({ atoms, bonds, isRotating }: MoleculeProps) {
    const groupRef = useRef<THREE.Group>(null);

    // Calculate center of mass to center the molecule
    const center = useMemo(() => {
        if (atoms.length === 0) return new THREE.Vector3(0, 0, 0);

        let sumX = 0, sumY = 0, sumZ = 0;
        atoms.forEach(atom => {
            sumX += atom.x;
            sumY += atom.y;
            sumZ += atom.z;
        });

        return new THREE.Vector3(
            sumX / atoms.length,
            sumY / atoms.length,
            sumZ / atoms.length
        );
    }, [atoms]);

    // Calculate appropriate scale based on molecule size
    const scale = useMemo(() => {
        if (atoms.length === 0) return 1;

        let maxDist = 0;
        atoms.forEach(atom => {
            const dist = Math.sqrt(
                Math.pow(atom.x - center.x, 2) +
                Math.pow(atom.y - center.y, 2) +
                Math.pow(atom.z - center.z, 2)
            );
            maxDist = Math.max(maxDist, dist);
        });

        // Scale to fit in a reasonable viewport
        return maxDist > 0 ? 3 / maxDist : 1;
    }, [atoms, center]);

    // Slow rotation animation
    useFrame((_, delta) => {
        if (groupRef.current && isRotating) {
            groupRef.current.rotation.y += delta * 0.3; // Slow rotation
        }
    });

    // Center the atoms
    const centeredAtoms = useMemo(() => {
        return atoms.map(atom => ({
            ...atom,
            x: atom.x - center.x,
            y: atom.y - center.y,
            z: atom.z - center.z
        }));
    }, [atoms, center]);

    return (
        <group ref={groupRef}>
            {/* Render bonds first (behind atoms) */}
            {bonds.map((bond, index) => (
                <BondCylinder
                    key={`bond-${index}`}
                    atoms={centeredAtoms}
                    bond={bond}
                    scale={scale}
                />
            ))}

            {/* Render atoms */}
            {centeredAtoms.map((atom) => (
                <AtomSphere
                    key={`atom-${atom.id}`}
                    atom={atom}
                    scale={scale}
                />
            ))}
        </group>
    );
}

interface MolecularViewerProps {
    drugId: string | null;
    drugName?: string;
}

export function MolecularViewer({ drugId, drugName }: MolecularViewerProps) {
    const [moleculeData, setMoleculeData] = useState<MoleculeData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isRotating, setIsRotating] = useState(true);

    useEffect(() => {
        if (!drugId) {
            setMoleculeData(null);
            setError(null);
            return;
        }

        const fetchMolecule = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`http://localhost:5001/api/molecule/${drugId}`);
                const data = await response.json();

                if (data.error) {
                    setError(data.error);
                    setMoleculeData(null);
                } else {
                    setMoleculeData(data);
                }
            } catch (err) {
                setError('Failed to fetch molecular structure');
                setMoleculeData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchMolecule();
    }, [drugId]);

    if (!drugId) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Select a drug to view its molecular structure
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-muted-foreground text-sm">Loading molecular structure...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">3D structure not available</p>
                <p className="text-xs mt-1">{drugName || drugId}</p>
            </div>
        );
    }

    if (!moleculeData || moleculeData.atoms.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No molecular data available
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            {/* Drug name label */}
            <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border border-border">
                <p className="text-sm font-medium text-foreground">{moleculeData.drug_name}</p>
                <p className="text-xs text-muted-foreground">
                    {moleculeData.atom_count} atoms · {moleculeData.bond_count} bonds
                </p>
            </div>

            {/* Rotation toggle */}
            <button
                onClick={() => setIsRotating(!isRotating)}
                className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-sm border border-border hover:bg-white transition-colors"
                title={isRotating ? 'Pause rotation' : 'Resume rotation'}
            >
                {isRotating ? (
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                    </svg>
                ) : (
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    </svg>
                )}
            </button>

            {/* 3D Canvas */}
            <Canvas
                camera={{ position: [0, 0, 8], fov: 50 }}
                onPointerDown={() => setIsRotating(false)}
                style={{ background: 'transparent' }}
            >
                {/* Lighting setup - soft, neutral, no dramatic shadows */}
                <ambientLight intensity={0.6} />
                <directionalLight position={[10, 10, 10]} intensity={0.4} />
                <directionalLight position={[-10, -10, -10]} intensity={0.2} />

                {/* The molecule */}
                <Molecule
                    atoms={moleculeData.atoms}
                    bonds={moleculeData.bonds}
                    isRotating={isRotating}
                />

                {/* Orbit controls for user interaction */}
                <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    dampingFactor={0.05}
                    rotateSpeed={0.5}
                    zoomSpeed={0.8}
                />
            </Canvas>

            {/* Atom legend */}
            <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm border border-border">
                <p className="text-xs text-muted-foreground mb-1.5">Atom Colors</p>
                <div className="flex gap-3 flex-wrap">
                    {Object.entries(ATOM_COLORS).slice(0, 6).map(([symbol, color]) => (
                        <div key={symbol} className="flex items-center gap-1">
                            <div
                                className="w-3 h-3 rounded-full border border-gray-300"
                                style={{ backgroundColor: color }}
                            />
                            <span className="text-xs text-foreground">{symbol}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
