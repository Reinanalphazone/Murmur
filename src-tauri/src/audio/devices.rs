use cpal::traits::{DeviceTrait, HostTrait};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioDevice {
    pub name: String,
    pub is_default: bool,
}

/// Get list of available audio input devices
pub fn get_input_devices() -> Result<Vec<AudioDevice>, String> {
    let host = cpal::default_host();
    let default_device = host.default_input_device();
    let default_name = default_device
        .as_ref()
        .and_then(|d| d.name().ok());

    let devices: Vec<AudioDevice> = host
        .input_devices()
        .map_err(|e| format!("Failed to get input devices: {}", e))?
        .filter_map(|device| {
            device.name().ok().map(|name| {
                let is_default = default_name.as_ref().map(|d| d == &name).unwrap_or(false);
                AudioDevice { name, is_default }
            })
        })
        .collect();

    Ok(devices)
}
